# Context Summary: Pathshala ERP

## Project State Overview
The project is progressing well. The database layer, including the extended schema and comprehensive seed data, has been successfully implemented. The next focus is on building the complete backend core and all API modules.

## Key Constraints and Requirements
- **Single Source of Truth**: `Ultimate_Pathshala_MasterPrompt_Corrected.docx`.
- **Modular Structure**: Backend, Frontend, Database, Docs, Tests, Docker, Assets, UML, Scripts.
- **Strict Implementation**: No placeholders, no TODOs, full implementation of all files.
- **Verification**: Mandatory consistency audit and `AUDIT_REPORT.md` before packaging.
- **Deliverable**: A single ZIP file named `Pathshala.zip`.

## Current Focus
- Completing the database layer (schema, migrations, seed data).
- Building the complete backend core (config, models, schemas, security, logging).

## Dependencies and Contracts
- **Database-Backend**: SQLAlchemy ORM models must match the SQL schema exactly.
- **Backend-Frontend**: API contracts (Pydantic schemas) must match the frontend data consumption.
- **Auth**: JWT-based authentication across all modules.
