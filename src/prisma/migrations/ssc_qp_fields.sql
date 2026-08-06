-- SSC: Add "Type of Awarding Body" dropdown field
ALTER TABLE sector_skill_councils ADD COLUMN type_of_awarding_body VARCHAR(100) NULL;

-- QP: Move "Sub Sector" field here from SSC
ALTER TABLE qualification_packs ADD COLUMN sub_sector VARCHAR(100) NULL;
