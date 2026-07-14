e# BATS formal model

## Validation and risk score

Let an EPCIS event be \(E\), the enabled rule set be
\(\mathcal{I}=\{G,Y,D,T,R,W,A\}\), and \(w_i\) the configured weight of rule
\(i\). Each normalized violation function
\(\delta_i(E, C)\in[0,1]\) is evaluated against context \(C\), which contains
the registered plot, actor, device, evidence hashes and preceding events.

\[
R(E,C)=\min\left(100,\sum_{i\in\mathcal{I}}w_i\delta_i(E,C)\right)
\]

The current v1 implementation uses binary violation functions. For example:

\[
\delta_G(E,C)=
\begin{cases}
0,&p_E\in P_C\\
1,&p_E\notin P_C
\end{cases}
\qquad
\delta_Y(E,C)=\mathbb{1}\left[
q_E+\sum_{e\in H(C)}q_e > 20000\,A_C
\right]
\]

where \(p_E\) is the reported coordinate, \(P_C\) the registered PostGIS
polygon, \(q_E\) the reported mass in kilograms, \(H(C)\) prior harvests in the
season and \(A_C\) the plot area in hectares.

Risk bands are green for \(R\leq30\), yellow for \(30<R\leq70\), and red for
\(R>70\). Blocking and scoring are separate decisions: a high score need not
be the only reason an event is rejected.

## Merkle commitment

For the \(N\) canonical EPCIS event hashes collected on day \(d\), BATS builds
a binary Merkle tree and submits only its root \(r_d\) to the EVM contract.
The on-chain number of stored commitments is therefore one per day:

\[
S_{\mathrm{BATS}}(N)=\Theta(1)
\]

compared with \(\Theta(N)\) transactions/storage updates for direct per-event
logging. Tree construction is \(\Theta(N)\); an inclusion proof contains
\(\lceil\log_2N\rceil\) sibling hashes, so client verification is
\(\Theta(\log N)\). This is an asymptotic statement; actual gas and wall-clock
costs must be reported from the reproducible benchmarks.

## Evaluation hypotheses

- H1: indexed PostGIS geofence latency grows sub-linearly over the evaluated
  range and remains within the declared API service-level objective.
- H2: one daily Merkle anchor consumes less gas than per-event baselines for
  \(N>1\), with savings increasing as daily event volume grows.
- H3: rule v1 detects the injected synthetic boundary violations, but pilot
  field data is required to estimate external precision and recall.
- H4: the offline-first Zalo flow achieves median task completion below 60
  seconds and SUS above 70 in a pre-registered pilot; these are targets, not
  current results.
