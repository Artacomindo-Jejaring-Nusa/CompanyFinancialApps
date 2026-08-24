-- Seed Base Master Data for FSPMS (Cleaned & Tailored for Ajnusa Finance)

-- 1. Base Service Types
INSERT INTO service_types (id, name, description, icon) VALUES
(1, 'INTERNET_FO', 'Fiber Optic & Dedicated Internet Link', 'Globe'),
(2, 'HOSTING_CLOUD', 'VPS, Dedicated Server, Domain & Cloud', 'Cloud'),
(3, 'SOFTWARE_SAAS', 'Software License & Subscription Apps', 'Laptop')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. Base Customers
INSERT INTO customers (id, customer_code, customer_name, pic_name, pic_contact, status) VALUES
(1, 'CUST-AJN', 'PT. Artacomindo Jejaring Nusa', 'Internal Finance', 'finance@ajnusa.com', 'ACTIVE'),
(2, 'CUST-SAT', 'PT. Sumber Alfaria Trijaya (Alfamart)', 'Pak Budi Santoso', '08123456789', 'ACTIVE'),
(3, 'CUST-MIDI', 'PT. Midi Utama Indonesia (Alfamidi)', 'Ibu Rina Wijaya', '08198765432', 'ACTIVE'),
(4, 'CUST-LAW', 'PT. Lancar Wiguna Sejahtera (Lawson)', 'Pak Hendra Kusuma', '08112233445', 'ACTIVE'),
(5, 'CUST-DAN', 'PT. Danpac Pharma', 'Ibu Dewi Lestari', '08155667788', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
  customer_name = EXCLUDED.customer_name,
  pic_name = EXCLUDED.pic_name,
  pic_contact = EXCLUDED.pic_contact;

-- 3. Providers / Vendors (JIP, iForte, Satkom, Parama, Jedi, Biznet, Telkom, etc.)
INSERT INTO providers (provider_code, provider_name, contact, status) VALUES
('PROV-JIP', 'PT Jakarta Infrastruktur Propertindo (JIP)', 'Billing Support', 'ACTIVE'),
('PROV-IFO', 'PT iForte Solusi Infotek (iForte)', 'Finance Support', 'ACTIVE'),
('PROV-SAT', 'PT Satkomindo Mediatama (Satkom)', 'Account Rep', 'ACTIVE'),
('PROV-PAR', 'PT Parama Data Unit (Parama)', 'Billing Rep', 'ACTIVE'),
('PROV-JED', 'PT Jedi Global Teknologi (Jedi)', 'Support Rep', 'ACTIVE'),
('PROV-BIZ', 'Biznet Networks', 'Enterprise Rep', 'ACTIVE'),
('PROV-IND', 'Indihome / Telkom', 'Enterprise Rep', 'ACTIVE'),
('PROV-AST', 'Astinet', 'Enterprise Rep', 'ACTIVE'),
('PROV-OXY', 'Oxygen', 'Enterprise Rep', 'ACTIVE'),
('PROV-MYR', 'MyRepublic', 'Enterprise Rep', 'ACTIVE'),
('PROV-MOR', 'Moratelindo', 'Billing Rep', 'ACTIVE'),
('PROV-LIN', 'Lintasarta', 'Enterprise Rep', 'ACTIVE'),
('PROV-JAG', 'Jagoweb', 'Cloud Support', 'ACTIVE')
ON CONFLICT (provider_code) DO UPDATE SET 
  provider_name = EXCLUDED.provider_name,
  status = EXCLUDED.status;

-- Delete removed vendors if present
DELETE FROM providers WHERE provider_code IN ('PROV-IOH', 'PROV-XL', 'PROV-AWS', 'PROV-GCP', 'PROV-MSF');
