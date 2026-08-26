# BATS-AgriGuard scenario support matrix

> **These results are synthetic scenario/rule-coverage measurements from an incomplete preliminary prototype and are not estimates of real-world fraud-detection accuracy.**

Common-support policy: Include a scenario only when the frozen BATS v1 adapter classifies its semantic support as supported. Exclude partial and unsupported scenarios regardless of either engine's detection outcome.

| scenarioId | groundTruth | primaryRule | PCIE support | BATS v1 support | BATS support classification | PCIE detected | BATS detected | notes |
|---|---|---|---|---|---|---|---|---|
| LEG-001 | legitimate | none | supported | sufficient | supported | false | false | Normal registered harvest. Both engines have sufficient semantic capability for this scenario. |
| LEG-002 | legitimate | none | supported | sufficient | supported | false | false | GPS strictly inside plantation A. Both engines have sufficient semantic capability for this scenario. |
| LEG-003 | legitimate | none | supported | insufficient | partial | false | false | GPS exactly on plantation A boundary. Common-support exclusion: BATS v1 does not declare boundary-inclusive ST_Covers-equivalent geometry semantics. |
| LEG-004 | legitimate | none | supported | insufficient | partial | false | false | Actor has current plantation authorization. Common-support exclusion: BATS v1 actor ownership is not equivalent to time-bounded plantation authorization. |
| LEG-005 | legitimate | none | supported | insufficient | unsupported | false | false | Historical actor authorization is valid at eventTime. Common-support exclusion: BATS v1 cannot resolve plantation authorization history at eventTime. |
| LEG-006 | legitimate | none | supported | insufficient | unsupported | false | false | Plantation registry version is active at eventTime. Common-support exclusion: BATS v1 cannot resolve versioned plantation status at eventTime. |
| LEG-007 | legitimate | none | supported | sufficient | supported | false | false | Season total is just below policy capacity. Both engines have sufficient semantic capability for this scenario. |
| LEG-008 | legitimate | none | supported | sufficient | supported | false | false | Season total equals policy capacity. Both engines have sufficient semantic capability for this scenario. |
| LEG-009 | legitimate | none | supported | sufficient | supported | false | false | Two sequential legitimate harvest declarations. Both engines have sufficient semantic capability for this scenario. |
| LEG-010 | legitimate | none | supported | insufficient | unsupported | false | false | Packing output reflects normal process loss. Common-support exclusion: BATS v1 has no provenance-scoped mass-balance model. |
| LEG-011 | legitimate | none | supported | insufficient | unsupported | false | false | Output equals provenance-scoped maximum. Common-support exclusion: BATS v1 has no provenance-scoped mass-balance model. |
| LEG-012 | legitimate | none | supported | insufficient | partial | false | false | Complete deterministic custody sequence. Common-support exclusion: BATS v1 only partially projects the custody vocabulary and does not validate custody locations. |
| ADV-001 | adversarial | G | supported | sufficient | supported | true | true | Reported GPS is outside the registry polygon. Both engines have sufficient semantic capability for this scenario. |
| ADV-002 | adversarial | I | supported | insufficient | partial | true | true | Actor has no plantation authorization. Common-support exclusion: BATS v1 actor ownership is not equivalent to time-bounded plantation authorization. |
| ADV-003 | adversarial | I | supported | insufficient | unsupported | true | false | Historical actor authorization expired before eventTime. Common-support exclusion: BATS v1 cannot resolve plantation authorization history at eventTime. |
| ADV-004 | adversarial | S | supported | insufficient | unsupported | true | false | Plantation code is inactive at eventTime. Common-support exclusion: BATS v1 cannot resolve versioned plantation status at eventTime. |
| ADV-005 | adversarial | Y | supported | sufficient | supported | true | false | Policy-derived seasonal capacity is exceeded. Both engines have sufficient semantic capability for this scenario. |
| ADV-006 | adversarial | M | supported | insufficient | unsupported | true | false | Output is greater than verified input capacity. Common-support exclusion: BATS v1 has no provenance-scoped mass-balance model. |
| ADV-007 | adversarial | M | supported | insufficient | unsupported | true | false | Only plantation B input supports an output claimed for A. Common-support exclusion: BATS v1 has no provenance-scoped mass-balance model. |
| ADV-008 | adversarial | M | supported | insufficient | unsupported | true | false | Plantation B input attempts to hide plantation A over-output. Common-support exclusion: BATS v1 has no provenance-scoped mass-balance model. |
| ADV-009 | adversarial | C | supported | insufficient | partial | true | true | Harvested lot skips RECEIVED and moves directly to PACKED. Common-support exclusion: BATS v1 only partially projects the custody vocabulary and does not validate custody locations. |
| ADV-010 | adversarial | C | supported | insufficient | partial | true | false | Custody transition omits its source. Common-support exclusion: BATS v1 does not validate custody source or destination locations. |
| ADV-011 | adversarial | G | supported | insufficient | partial | true | true | Outside GPS, unauthorized actor and yield overrun occur together. Common-support exclusion: The authorization component is not semantically equivalent in BATS v1. |
| ADV-012 | adversarial | M | supported | insufficient | partial | true | true | Over-output accompanies an impossible custody transition. Common-support exclusion: BATS v1 lacks provenance mass balance and only partially projects custody transitions. |
