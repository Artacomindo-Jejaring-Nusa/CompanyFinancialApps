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
INSERT INTO providers (id, provider_code, provider_name, contact, status) VALUES
(1, 'PROV-JIP', 'PT Jakarta Infrastruktur Propertindo (JIP)', 'Billing Support', 'ACTIVE'),
(2, 'PROV-IFO', 'PT iForte Solusi Infotek (iForte)', 'Finance Support', 'ACTIVE'),
(3, 'PROV-SAT', 'PT Satkomindo Mediatama (Satkom)', 'Account Rep', 'ACTIVE'),
(4, 'PROV-PAR', 'PT Parama Data Unit (Parama)', 'Billing Rep', 'ACTIVE'),
(5, 'PROV-JED', 'PT Jedi Global Teknologi (Jedi)', 'Support Rep', 'ACTIVE'),
(6, 'PROV-BIZ', 'Biznet Networks', 'Enterprise Rep', 'ACTIVE'),
(7, 'PROV-IND', 'Indihome / Telkom', 'Enterprise Rep', 'ACTIVE'),
(8, 'PROV-AST', 'Astinet', 'Enterprise Rep', 'ACTIVE'),
(9, 'PROV-OXY', 'Oxygen', 'Enterprise Rep', 'ACTIVE'),
(10, 'PROV-MYR', 'MyRepublic', 'Enterprise Rep', 'ACTIVE'),
(11, 'PROV-MOR', 'Moratelindo', 'Billing Rep', 'ACTIVE'),
(12, 'PROV-LIN', 'Lintasarta', 'Enterprise Rep', 'ACTIVE'),
(13, 'PROV-JAG', 'Jagoweb', 'Cloud Support', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
  provider_name = EXCLUDED.provider_name,
  provider_code = EXCLUDED.provider_code;

-- Delete removed vendors if present
DELETE FROM providers WHERE provider_code IN ('PROV-IOH', 'PROV-XL', 'PROV-AWS', 'PROV-GCP', 'PROV-MSF');
