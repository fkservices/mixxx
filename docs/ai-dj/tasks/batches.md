# Reference execution batches

> Autonomously AI-generated task planning. No workers have been dispatched.

[Start here](../../../TASKS.md) · [Execution rules](../EXECUTION-PLAN.md) · [Worker cards](README.md)

These batches are validated against dependencies, exact owned paths and exclusive resources for the current 171-card catalog. They assume prior batches eventually pass all evidence gates. They are not a timed schedule and do not bypass dynamic children, long jobs or human listening. Regenerate after catalog changes; recompute actual readiness after every handoff.

| Batch | Proposed parallel cards | Exclusive resources |
| --- | --- | --- |
| B001 | [F01](00-foundation.md) | Exact path reservations only |
| B002 | [F02](00-foundation.md) | Exact path reservations only |
| B003 | [F03](00-foundation.md), [F06](00-foundation.md) | package-manifest |
| B004 | [F04](00-foundation.md), [F07](00-foundation.md) | install-job, package-manifest |
| B005 | [F05](00-foundation.md), [F08](00-foundation.md), [F09](00-foundation.md) | install-job |
| B006 | [F10](00-foundation.md), [F11](00-foundation.md), [F12](00-foundation.md) | mixxx-runtime |
| B007 | [M01](01-local-midi.md), [M03](01-local-midi.md), [M04](01-local-midi.md) | midi-enumeration |
| B008 | [M02](01-local-midi.md), [R01](03-reliability.md) | mixxx-runtime |
| B009 | [M05](01-local-midi.md), [R02](03-reliability.md), [R03](03-reliability.md) | mapping-entry, mixxx-runtime |
| B010 | [M06](01-local-midi.md), [M07](01-local-midi.md), [M08](01-local-midi.md) | Exact path reservations only |
| B011 | [M09](01-local-midi.md), [I01](02-inventory.md), [R04](03-reliability.md) | mixxx-runtime |
| B012 | [M10](01-local-midi.md), [R05](03-reliability.md), [R15](03-reliability.md) | mapping-entry, mixxx-runtime |
| B013 | [M11](01-local-midi.md), [I02](02-inventory.md), [R20](03-reliability.md) | app-entry, mixxx-runtime |
| B014 | [M12](01-local-midi.md), [M14](01-local-midi.md), [P01](04-playlists.md) | mixxx-runtime |
| B015 | [M13](01-local-midi.md), [P07](04-playlists.md), [P09](04-playlists.md) | mixxx-runtime |
| B016 | [M15](01-local-midi.md), [P10](04-playlists.md), [O01](07-observability.md) | mixxx-runtime |
| B017 | [M16](01-local-midi.md), [P11](04-playlists.md), [O02](07-observability.md) | mixxx-runtime |
| B018 | [M17](01-local-midi.md), [O05](07-observability.md), [O07](07-observability.md) | mixxx-runtime |
| B019 | [M18](01-local-midi.md), [U01](08-desktop-ui.md) | mixxx-runtime |
| B020 | [M19](01-local-midi.md), [I03](02-inventory.md), [U02](08-desktop-ui.md) | mixxx-runtime, ui-entry |
| B021 | [I04](02-inventory.md) | mixxx-runtime |
| B022 | [I05](02-inventory.md) | mixxx-runtime |
| B023 | [I06](02-inventory.md) | mixxx-runtime |
| B024 | [I07](02-inventory.md) | mixxx-runtime |
| B025 | [I08](02-inventory.md) | mixxx-runtime |
| B026 | [I09](02-inventory.md) | mixxx-runtime |
| B027 | [I10](02-inventory.md) | mixxx-runtime |
| B028 | [I11](02-inventory.md) | mixxx-runtime |
| B029 | [I12](02-inventory.md) | mixxx-runtime |
| B030 | [I13](02-inventory.md) | mixxx-runtime |
| B031 | [I14](02-inventory.md), [P02](04-playlists.md) | mixxx-runtime |
| B032 | [I15](02-inventory.md), [P06](04-playlists.md) | mixxx-runtime |
| B033 | [I16](02-inventory.md), [P20](09-product-options.md) | mixxx-runtime |
| B034 | [I17](02-inventory.md) | mixxx-runtime |
| B035 | [I18](02-inventory.md) | mixxx-runtime |
| B036 | [I19](02-inventory.md) | mixxx-runtime |
| B037 | [I20](02-inventory.md) | mixxx-runtime |
| B038 | [I21](02-inventory.md) | mixxx-runtime |
| B039 | [I22](02-inventory.md) | mixxx-runtime |
| B040 | [I23](02-inventory.md), [O04](07-observability.md) | mixxx-runtime |
| B041 | [M20](01-local-midi.md), [R06](03-reliability.md) | Exact path reservations only |
| B042 | [R07](03-reliability.md) | Exact path reservations only |
| B043 | [R08](03-reliability.md) | Exact path reservations only |
| B044 | [R09](03-reliability.md) | Exact path reservations only |
| B045 | [R10](03-reliability.md), [R13](03-reliability.md), [O06](07-observability.md) | Exact path reservations only |
| B046 | [R11](03-reliability.md), [R14](03-reliability.md), [R17](03-reliability.md) | Exact path reservations only |
| B047 | [R12](03-reliability.md), [P03](04-playlists.md), [D01](05-performance.md) | Exact path reservations only |
| B048 | [R16](03-reliability.md), [P04](04-playlists.md), [P08](04-playlists.md) | host-build |
| B049 | [R18](03-reliability.md), [P05](04-playlists.md), [P12](04-playlists.md) | Exact path reservations only |
| B050 | [R19](03-reliability.md), [P14](04-playlists.md), [A01](06-ai.md) | Exact path reservations only |
| B051 | [R21](03-reliability.md), [P15](04-playlists.md), [D03](05-performance.md) | app-entry, mapping-entry |
| B052 | [R22](03-reliability.md), [D02](05-performance.md), [A02](06-ai.md) | mixxx-runtime |
| B053 | [A03](06-ai.md), [A06](06-ai.md), [O03](07-observability.md) | Exact path reservations only |
| B054 | [A04](06-ai.md), [A07](06-ai.md), [U03](08-desktop-ui.md) | Exact path reservations only |
| B055 | [A05](06-ai.md), [A08](06-ai.md), [R25](03-reliability.md) | Exact path reservations only |
| B056 | [R23](03-reliability.md), [P17](04-playlists.md), [A09](06-ai.md) | mixxx-runtime |
| B057 | [R24](03-reliability.md), [D04](05-performance.md), [U04](08-desktop-ui.md) | Exact path reservations only |
| B058 | [P13](04-playlists.md), [O08](07-observability.md), [P19](09-product-options.md) | mixxx-runtime |
| B059 | [P16](04-playlists.md), [O09](07-observability.md), [U05](08-desktop-ui.md) | mixxx-runtime |
| B060 | [P18](04-playlists.md), [O10](07-observability.md), [R26](03-reliability.md) | mixxx-runtime |
| B061 | [D05](05-performance.md), [O11](07-observability.md), [U06](08-desktop-ui.md) | mixxx-runtime |
| B062 | [D06](05-performance.md), [U07](08-desktop-ui.md), [P21](09-product-options.md) | mixxx-runtime |
| B063 | [D07](05-performance.md), [P22](09-product-options.md), [P23](09-product-options.md) | Exact path reservations only |
| B064 | [A13](06-ai.md), [P24](09-product-options.md), [A15](09-product-options.md) | mixxx-runtime |
| B065 | [A16](09-product-options.md), [A17](09-product-options.md), [O12](09-product-options.md) | Exact path reservations only |
| B066 | [A10](06-ai.md), [A18](09-product-options.md), [O13](09-product-options.md) | Exact path reservations only |
| B067 | [A11](06-ai.md), [O14](09-product-options.md), [O15](09-product-options.md) | Exact path reservations only |
| B068 | [A12](06-ai.md), [U09](09-product-options.md), [U10](09-product-options.md) | mixxx-runtime |
| B069 | [A14](06-ai.md), [U11](09-product-options.md), [U12](09-product-options.md) | Exact path reservations only |
| B070 | [C01](10-full-coverage.md), [L01](11-release.md) | Exact path reservations only |
| B071 | [C02](10-full-coverage.md), [L02](11-release.md) | Exact path reservations only |
| B072 | [U08](08-desktop-ui.md), [L03](11-release.md) | mixxx-runtime, package-manifest |
| B073 | [L04](11-release.md) | Exact path reservations only |
| B074 | [L05](11-release.md) | mixxx-runtime |
| B075 | [L06](11-release.md) | Exact path reservations only |
| B076 | [L07](11-release.md) | mixxx-runtime |
| B077 | [L08](11-release.md) | Exact path reservations only |
| B078 | [L09](11-release.md) | mixxx-runtime |
| B079 | [L10](11-release.md) | Exact path reservations only |
| B080 | [L11](11-release.md) | Exact path reservations only |
| B081 | [L12](11-release.md) | Exact path reservations only |

> End of autonomously AI-generated task planning.
