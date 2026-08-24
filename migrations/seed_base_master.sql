INSERT INTO customers (id, customer_code, customer_name, contact, status) VALUES
(1, 'CUST-ARTA', 'PT Artacom Jaya Nusantara', 'Finance Support', 'ACTIVE'),
(2, 'CUST-ALFA', 'PT Sumber Alfaria Trijaya Tbk (Alfamart)', 'Ops Support', 'ACTIVE'),
(3, 'CUST-INDO', 'PT Indomarco Prismatama (Indomaret)', 'Ops Support', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO providers (id, provider_code, provider_name, contact, status) VALUES
(1, 'PROV-BIZ', 'Biznet Networks', 'Enterprise Rep', 'ACTIVE'),
(2, 'PROV-IND', 'Indihome / Telkom', 'Enterprise Rep', 'ACTIVE'),
(3, 'PROV-AST', 'Astinet', 'Enterprise Rep', 'ACTIVE'),
(4, 'PROV-OXY', 'Oxygen', 'Enterprise Rep', 'ACTIVE'),
(5, 'PROV-MYR', 'MyRepublic', 'Enterprise Rep', 'ACTIVE'),
(6, 'PROV-JIP', 'PT Jakarta Infrastruktur Propertindo (JIP)', 'Billing Support', 'ACTIVE'),
(7, 'PROV-IFO', 'PT iForte Solusi Infotek (iForte)', 'Finance Support', 'ACTIVE'),
(8, 'PROV-SAT', 'PT Satkomindo Mediatama (Satkom)', 'Account Rep', 'ACTIVE'),
(9, 'PROV-PAR', 'PT Parama Data Unit (Parama)', 'Billing Rep', 'ACTIVE'),
(10, 'PROV-JED', 'PT Jedi Global Teknologi (Jedi)', 'Support Rep', 'ACTIVE'),
(11, 'PROV-IOH', 'Indosat Ooredoo Hutchison', 'Enterprise Rep', 'ACTIVE'),
(12, 'PROV-XL', 'XL Axiata', 'Corporate Rep', 'ACTIVE'),
(13, 'PROV-MOR', 'Moratelindo', 'Billing Rep', 'ACTIVE'),
(14, 'PROV-LIN', 'Lintasarta', 'Enterprise Rep', 'ACTIVE'),
(15, 'PROV-JAG', 'Jagoweb', 'Cloud Support', 'ACTIVE'),
(16, 'PROV-AWS', 'Amazon Web Services (AWS)', 'Cloud Billing', 'ACTIVE'),
(17, 'PROV-GCP', 'Google Cloud Platform (GCP)', 'Workspace Billing', 'ACTIVE'),
(18, 'PROV-MSF', 'Microsoft Azure / 365', 'Enterprise Rep', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
  provider_name = EXCLUDED.provider_name,
  provider_code = EXCLUDED.provider_code;

INSERT INTO service_types (id, name, status) VALUES
(1, 'Fiber Optic Dedicated', 'ACTIVE'),
(2, 'VSAT Satellite', 'ACTIVE'),
(3, 'Cloud VPS & Hosting', 'ACTIVE'),
(4, 'Software SaaS License', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
