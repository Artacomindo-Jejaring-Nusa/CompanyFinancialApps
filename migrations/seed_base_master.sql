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
(5, 'PROV-MYR', 'MyRepublic', 'Enterprise Rep', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_types (id, name, status) VALUES
(1, 'Fiber Optic Dedicated', 'ACTIVE'),
(2, 'VSAT Satellite', 'ACTIVE'),
(3, 'Cloud VPS & Hosting', 'ACTIVE'),
(4, 'Software SaaS License', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
