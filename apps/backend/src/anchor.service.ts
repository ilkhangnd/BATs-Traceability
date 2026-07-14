import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import type { AnchorRecord, Batch } from "./domain.js";
import { MerkleService } from "./merkle.service.js";
import { StoreService } from "./store.service.js";

const SCHEMA_VERSION = "bats-epcis-0.1";
const ABI = [
  "function anchorDailyRoot(bytes32 merkleRoot,string batchDate,string schemaVersion)",
  "function verifyRoot(bytes32 merkleRoot,string batchDate) view returns (bool)"
];

@Injectable()
export class AnchorService {
  constructor(
    @Inject(StoreService) private readonly store: StoreService,
    @Inject(MerkleService) private readonly merkle: MerkleService
  ) {}

  list(): AnchorRecord[] {
    return [...this.store.anchors.values()].sort((a, b) => b.date.localeCompare(a.date));
  }

  async health(): Promise<{
    ok: boolean;
    rpcConfigured: boolean;
    contractConfigured: boolean;
    blockNumber?: number;
  }> {
    const rpcUrl = process.env.CHAIN_RPC_URL;
    const contractAddress = process.env.ANCHOR_CONTRACT_ADDRESS;
    if (!rpcUrl || !contractAddress) {
      return {
        ok: false,
        rpcConfigured: Boolean(rpcUrl),
        contractConfigured: Boolean(contractAddress)
      };
    }
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const [blockNumber, code] = await Promise.all([
        provider.getBlockNumber(),
        provider.getCode(contractAddress)
      ]);
      return {
        ok: code !== "0x",
        rpcConfigured: true,
        contractConfigured: true,
        blockNumber
      };
    } catch {
      return { ok: false, rpcConfigured: true, contractConfigured: true };
    }
  }

  dailyTree(date: string) {
    this.validateDate(date);
    const events = this.store
      .listBatches()
      .flatMap((batch) => batch.events)
      .filter((event) => this.eventDate(event.eventTime) === date)
      .sort((a, b) => a.eventTime.localeCompare(b.eventTime) || a.id.localeCompare(b.id));
    const leaves = events.map((event) => event.eventHash);
    return { date, events, leaves, merkleRoot: this.merkle.root(leaves) };
  }

  async anchorDate(date: string): Promise<AnchorRecord> {
    const tree = this.dailyTree(date);
    if (tree.leaves.length === 0) {
      throw new NotFoundException(`Không có EPCIS event trong ngày ${date}.`);
    }
    const existing = this.store.anchors.get(date);
    if (existing?.status === "confirmed") {
      if (existing.merkleRoot !== tree.merkleRoot) {
        throw new BadRequestException(
          `Ngày ${date} đã neo nhưng tập event hiện tại tạo ra root khác.`
        );
      }
      if (await this.isRootOnChain(existing, tree.merkleRoot)) return existing;
    }
    const rpcUrl = process.env.CHAIN_RPC_URL;
    const contractAddress = process.env.ANCHOR_CONTRACT_ADDRESS;
    const privateKey = process.env.ANCHOR_PRIVATE_KEY;
    if (!rpcUrl || !contractAddress || !privateKey) {
      throw new ServiceUnavailableException(
        "Chưa cấu hình CHAIN_RPC_URL, ANCHOR_CONTRACT_ADDRESS và ANCHOR_PRIVATE_KEY."
      );
    }
    const attemptCount = (existing?.attemptCount ?? 0) + 1;
    const pending: AnchorRecord = {
      date,
      merkleRoot: tree.merkleRoot,
      schemaVersion: SCHEMA_VERSION,
      contractAddress,
      status: "pending",
      attemptCount
    };
    await this.store.saveAnchor(pending);
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const signer = new Wallet(privateKey, provider);
      const contract = new Contract(contractAddress, ABI, signer);
      const transaction = await contract.getFunction("anchorDailyRoot")(
        `0x${tree.merkleRoot}`,
        date,
        SCHEMA_VERSION
      );
      const receipt = await transaction.wait();
      if (!receipt) {
        throw new ServiceUnavailableException("Không nhận được transaction receipt.");
      }
      const network = await provider.getNetwork();
      const anchor: AnchorRecord = {
        ...pending,
        chainId: network.chainId.toString(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber.toString(),
        status: "confirmed",
        lastError: undefined,
        nextAttemptAt: undefined,
        anchoredAt: new Date().toISOString()
      };
      await this.store.saveAnchor(anchor);
      return anchor;
    } catch (error) {
      const retryBaseMs = positiveInteger(process.env.ANCHOR_RETRY_BASE_MS, 60_000);
      const retryMaxMs = positiveInteger(process.env.ANCHOR_RETRY_MAX_MS, 86_400_000);
      const delay = Math.min(retryMaxMs, retryBaseMs * 2 ** Math.min(attemptCount - 1, 10));
      await this.store.saveAnchor({
        ...pending,
        status: "failed",
        lastError: error instanceof Error ? error.message.slice(0, 2_000) : String(error),
        nextAttemptAt: new Date(Date.now() + delay).toISOString()
      });
      throw error;
    }
  }

  async verification(batch: Batch) {
    const proofs = batch.events.map((event) => {
      const date = this.eventDate(event.eventTime);
      const tree = this.dailyTree(date);
      const leafIndex = tree.events.findIndex((candidate) => candidate.id === event.id);
      const anchor = this.store.anchors.get(date);
      const siblings = this.merkle.proof(tree.leaves, leafIndex);
      return {
        eventHash: event.eventHash,
        date,
        leafIndex,
        siblings,
        merkleRoot: tree.merkleRoot,
        proofValid: this.merkle.verify(event.eventHash, siblings, leafIndex, tree.merkleRoot),
        chainStatus: anchor?.status ?? "not-anchored",
        txHash: anchor?.txHash
      };
    });
    const primaryDate = batch.events[0]
      ? this.eventDate(batch.events[0].eventTime)
      : this.eventDate(batch.createdAt);
    const tree = this.dailyTree(primaryDate);
    const stored = this.store.anchors.get(primaryDate);
    let contractVerified = false;
    if (
      stored?.status === "confirmed" &&
      process.env.CHAIN_RPC_URL &&
      stored.contractAddress
    ) {
      try {
        const contract = new Contract(
          stored.contractAddress,
          ABI,
          new JsonRpcProvider(process.env.CHAIN_RPC_URL)
        );
        contractVerified = await contract.getFunction("verifyRoot")(
          `0x${tree.merkleRoot}`,
          primaryDate
        );
      } catch {
        contractVerified = false;
      }
    }
    return {
      anchor: {
        ...(stored ?? {
          date: primaryDate,
          merkleRoot: tree.merkleRoot,
          schemaVersion: SCHEMA_VERSION,
          status: "pending"
        }),
        chainStatus: contractVerified ? "confirmed-on-chain" : stored?.status ?? "local-proof",
        contractVerified
      },
      proofs
    };
  }

  private validateDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new BadRequestException("Ngày neo phải có định dạng YYYY-MM-DD.");
    }
  }

  private async isRootOnChain(anchor: AnchorRecord, merkleRoot: string): Promise<boolean> {
    if (!process.env.CHAIN_RPC_URL || !anchor.contractAddress) return false;
    try {
      const contract = new Contract(
        anchor.contractAddress,
        ABI,
        new JsonRpcProvider(process.env.CHAIN_RPC_URL)
      );
      return await contract.getFunction("verifyRoot")(`0x${merkleRoot}`, anchor.date);
    } catch {
      return false;
    }
  }

  private eventDate(eventTime: string): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: process.env.BUSINESS_TIMEZONE ?? "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(eventTime));
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
