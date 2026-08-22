
INSERT INTO service_types (id, name, attribute_schema, status) VALUES
(1, 'FO-GSM', '[{"name":"ip_address","label":"IP Address","type":"text"},{"name":"vlan","label":"VLAN","type":"text"}]'::jsonb, 'ACTIVE'),
(2, 'DUAL-GSM', '[{"name":"sim_primary","label":"Primary SIM","type":"text"}]'::jsonb, 'ACTIVE'),
(3, 'Fiber Optic Dedicated', '[{"name":"circuit_id","label":"Circuit ID","type":"text"}]'::jsonb, 'ACTIVE'),
(4, 'VSAT Satellite', '[{"name":"transponder","label":"Transponder","type":"text"}]'::jsonb, 'ACTIVE'),
(5, 'Cloud VPS & Hosting', '[{"name":"ip_address","label":"Server IP","type":"text"},{"name":"ram_core","label":"Specs (RAM/CPU)","type":"text"}]'::jsonb, 'ACTIVE'),
(6, 'Data Center Co-location', '[{"name":"rack_number","label":"Rack No","type":"text"}]'::jsonb, 'ACTIVE'),
(7, 'Software SaaS License', '[{"name":"user_seats","label":"Total Seats","type":"number"}]'::jsonb, 'ACTIVE'),
(8, 'Hardware Rental & Server', '[{"name":"serial_number","label":"Serial No","type":"text"}]'::jsonb, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, attribute_schema = EXCLUDED.attribute_schema;



INSERT INTO providers (id, provider_code, provider_name, contact, email, phone, status) VALUES
(11, 'PROV-AWS', 'Amazon Web Services (AWS)', 'Cloud Account Mgr', 'aws@amazon.com', '021-300011', 'ACTIVE'),
(12, 'PROV-GCP', 'Google Cloud Platform (GCP)', 'Cloud Account Mgr', 'gcp@google.com', '021-300022', 'ACTIVE'),
(13, 'PROV-MSFT', 'Microsoft Azure / M365', 'Enterprise Sales', 'msft@microsoft.com', '021-300033', 'ACTIVE'),
(14, 'PROV-BGIO', 'Biznet GIO Cloud', 'Support Rep', 'support@biznetgio.com', '021-579988', 'ACTIVE'),
(15, 'PROV-NIAGA', 'Niagahoster / Hostinger', 'Billing Dept', 'billing@niagahoster.co.id', '0274-28888', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


INSERT INTO services (id, service_type_id, customer_id, provider_id, service_name, cid, site_id, site_name, location, contract_number, billing_cycle, due_day, amount, start_date, pic, status, attributes) VALUES
('30000000-0000-4000-7000-000000000001', 5, 3, 11, 'AWS Cloud Infrastructure - Main Production', 'AWS-PROD-SG', 'AWS-SG-01', 'AWS Singapore Region', 'Singapore DC', 'CTR-AWS-2026', 'MONTHLY', 25, 45000000, '2024-01-01', 'IT & Infrastructure', 'ACTIVE', '{"ip_address":"52.77.12.99","ram_core":"64GB RAM / 16 vCPU"}'::jsonb),
('30000000-0000-4000-7000-000000000002', 5, 3, 14, 'Biznet GIO Cloud - Backup & Storage Node', 'BGIO-STG-01', 'GIO-JKT-02', 'Biznet Cyber 1 DC', 'Jakarta Cyber 1', 'CTR-GIO-2026', 'MONTHLY', 15, 18500000, '2024-03-01', 'IT & Infrastructure', 'ACTIVE', '{"ip_address":"103.211.12.5","ram_core":"32GB RAM / 8 vCPU"}'::jsonb),
('30000000-0000-4000-7000-000000000003', 6, 3, 10, 'Data Center Co-location Rack - Cyber Building', 'RACK-CYBER-01', 'CYBER-RACK-A4', 'Gedung Cyber 1 Lt 3', 'Jl. Mampang Prapatan, Jakarta', 'CTR-COL-2026', 'MONTHLY', 10, 28000000, '2023-05-01', 'IT & Infrastructure', 'ACTIVE', '{"rack_number":"Rack A-44 (42U)"}'::jsonb),
('30000000-0000-4000-7000-000000000004', 5, 3, 15, 'Niagahoster VPS Cloud - Staging & Testing Server', 'NIAGA-VPS-01', 'NIAGA-YOG', 'Niagahoster Yogya DC', 'Yogyakarta', 'CTR-NIA-2026', 'MONTHLY', 20, 4500000, '2024-06-01', 'IT & Infrastructure', 'ACTIVE', '{"ip_address":"156.67.218.40","ram_core":"16GB RAM / 4 vCPU"}'::jsonb),
('40000000-0000-4000-7000-000000000001', 7, 3, 12, 'Google Workspace Enterprise - Corporate Email', 'GWS-ENT-500', 'GWS-HQ', 'Google Cloud US', 'Global Cloud', 'CTR-GWS-2026', 'MONTHLY', 25, 32000000, '2023-01-01', 'IT & Infrastructure', 'ACTIVE', '{"user_seats":500}'::jsonb),
('40000000-0000-4000-7000-000000000002', 7, 3, 13, 'Microsoft 365 E5 - Finance & Management', 'M365-E5-150', 'M365-HQ', 'Microsoft Cloud', 'Global Cloud', 'CTR-MS365-2026', 'MONTHLY', 15, 24500000, '2024-02-01', 'IT & Infrastructure', 'ACTIVE', '{"user_seats":150}'::jsonb),
('40000000-0000-4000-7000-000000000003', 7, 3, 11, 'Zoom Business & Webinar License', 'ZOOM-BIZ-50', 'ZOOM-HQ', 'Zoom Cloud', 'Global Cloud', 'CTR-ZOOM-2026', 'MONTHLY', 5, 8500000, '2024-04-01', 'IT & Infrastructure', 'ACTIVE', '{"user_seats":50}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_schedules (id, service_id, period, due_date, amount, remaining_amount, status) VALUES
('50000000-0000-4000-7000-000000005001', '30000000-0000-4000-7000-000000000001', '2026-08', '2026-08-25', 45000000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005002', '30000000-0000-4000-7000-000000000001', '2026-09', '2026-09-25', 45000000, 45000000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005003', '30000000-0000-4000-7000-000000000001', '2026-10', '2026-10-25', 45000000, 45000000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005004', '30000000-0000-4000-7000-000000000002', '2026-08', '2026-08-15', 18500000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005005', '30000000-0000-4000-7000-000000000002', '2026-09', '2026-09-15', 18500000, 18500000, 'OVERDUE'),
('50000000-0000-4000-7000-000000005006', '30000000-0000-4000-7000-000000000002', '2026-10', '2026-10-15', 18500000, 18500000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005007', '30000000-0000-4000-7000-000000000003', '2026-08', '2026-08-10', 28000000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005008', '30000000-0000-4000-7000-000000000003', '2026-09', '2026-09-10', 28000000, 28000000, 'OVERDUE'),
('50000000-0000-4000-7000-000000005009', '30000000-0000-4000-7000-000000000003', '2026-10', '2026-10-10', 28000000, 28000000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005010', '30000000-0000-4000-7000-000000000004', '2026-08', '2026-08-20', 4500000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005011', '30000000-0000-4000-7000-000000000004', '2026-09', '2026-09-20', 4500000, 4500000, 'OVERDUE'),
('50000000-0000-4000-7000-000000005012', '30000000-0000-4000-7000-000000000004', '2026-10', '2026-10-20', 4500000, 4500000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005013', '40000000-0000-4000-7000-000000000001', '2026-08', '2026-08-25', 32000000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005014', '40000000-0000-4000-7000-000000000001', '2026-09', '2026-09-25', 32000000, 32000000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005015', '40000000-0000-4000-7000-000000000001', '2026-10', '2026-10-25', 32000000, 32000000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005016', '40000000-0000-4000-7000-000000000002', '2026-08', '2026-08-15', 24500000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005017', '40000000-0000-4000-7000-000000000002', '2026-09', '2026-09-15', 24500000, 24500000, 'OVERDUE'),
('50000000-0000-4000-7000-000000005018', '40000000-0000-4000-7000-000000000002', '2026-10', '2026-10-15', 24500000, 24500000, 'UPCOMING'),
('50000000-0000-4000-7000-000000005019', '40000000-0000-4000-7000-000000000003', '2026-08', '2026-08-05', 8500000, 0, 'PAID'),
('50000000-0000-4000-7000-000000005020', '40000000-0000-4000-7000-000000000003', '2026-09', '2026-09-05', 8500000, 8500000, 'OVERDUE'),
('50000000-0000-4000-7000-000000005021', '40000000-0000-4000-7000-000000000003', '2026-10', '2026-10-05', 8500000, 8500000, 'UPCOMING')
ON CONFLICT (service_id, period) DO NOTHING;