# Pilot data dictionary

| Field | Type | Description | Identifiability |
|---|---|---|---|
| participant_id | string | Random study ID | Pseudonymous |
| session_id | string | Random session ID | Pseudonymous |
| role_group | enum | farmer/cooperative/collector | Indirect |
| device_os | string | OS family and major version | Indirect |
| device_model_group | string | Coarsened device class | Indirect |
| network_condition | enum | online/weak/offline-recovery | Non-identifying |
| task_id | string | Protocol task code | Non-identifying |
| started_at | datetime | Task start | Indirect |
| completed_at | datetime/null | Task completion | Indirect |
| completed | boolean | Completion outcome | Non-identifying |
| assistance_count | integer | Number of interventions | Non-identifying |
| validation_error_count | integer | Client/server validation errors | Non-identifying |
| sync_attempt_count | integer | Queue sync attempts | Non-identifying |
| duplicate_created | boolean | Exactly-once failure | Non-identifying |
| sus_q01…sus_q10 | integer 1–5 | Raw SUS answers | Pseudonymous |
| sus_score | number 0–100 | Derived SUS score | Pseudonymous |
| observer_note_code | enum[] | Predefined thematic codes | Pseudonymous |

Không đưa tên, số điện thoại, Zalo user ID, tọa độ nhà riêng hoặc ảnh thật vào
dataset phân tích. Bảng liên kết participant ID với consent record phải được mã
hóa và lưu tách biệt.
