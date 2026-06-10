
-- Deactivate all existing bundles (preserves FK to orders for history)
UPDATE public.bundles SET active = false;

-- MTN catalog
INSERT INTO public.bundles (network, name, data_mb, price_ghs, cost_price_ghs, validity, active, sort_order) VALUES
('MTN','MTN 1GB',1024,4.68,3.90,'90 days',true,10),
('MTN','MTN 2GB',2048,9.36,7.80,'90 days',true,20),
('MTN','MTN 3GB',3072,14.04,11.70,'90 days',true,30),
('MTN','MTN 4GB',4096,18.72,15.60,'90 days',true,40),
('MTN','MTN 5GB',5120,23.40,19.50,'90 days',true,50),
('MTN','MTN 6GB',6144,28.08,23.40,'90 days',true,60),
('MTN','MTN 8GB',8192,37.44,31.20,'90 days',true,70),
('MTN','MTN 10GB',10240,46.08,38.40,'90 days',true,80),
('MTN','MTN 15GB',15360,68.40,57.00,'90 days',true,90),
('MTN','MTN 20GB',20480,91.20,76.00,'90 days',true,100),
('MTN','MTN 25GB',25600,114.00,95.00,'90 days',true,110),
('MTN','MTN 30GB',30720,136.80,114.00,'90 days',true,120),
('MTN','MTN 40GB',40960,184.32,153.60,'90 days',true,130),
('MTN','MTN 50GB',51200,230.40,192.00,'90 days',true,140);

-- AirtelTigo (AT enum)
INSERT INTO public.bundles (network, name, data_mb, price_ghs, cost_price_ghs, validity, active, sort_order) VALUES
('AT','AirtelTigo 1GB',1024,4.50,3.75,'90 days',true,10),
('AT','AirtelTigo 2GB',2048,8.88,7.40,'90 days',true,20),
('AT','AirtelTigo 3GB',3072,13.32,11.10,'90 days',true,30),
('AT','AirtelTigo 4GB',4096,17.76,14.80,'90 days',true,40),
('AT','AirtelTigo 5GB',5120,22.20,18.50,'90 days',true,50),
('AT','AirtelTigo 6GB',6144,26.64,22.20,'90 days',true,60),
('AT','AirtelTigo 8GB',8192,35.52,29.60,'90 days',true,70),
('AT','AirtelTigo 10GB',10240,44.40,37.00,'90 days',true,80),
('AT','AirtelTigo 12GB',12288,53.28,44.40,'90 days',true,90),
('AT','AirtelTigo 20GB',20480,88.80,74.00,'90 days',true,100),
('AT','AirtelTigo 25GB',25600,111.00,92.50,'90 days',true,110),
('AT','AirtelTigo 30GB',30720,133.20,111.00,'90 days',true,120);

-- Telecel
INSERT INTO public.bundles (network, name, data_mb, price_ghs, cost_price_ghs, validity, active, sort_order) VALUES
('Telecel','Telecel 10GB',10240,45.60,38.00,'90 days',true,10),
('Telecel','Telecel 15GB',15360,66.00,55.00,'90 days',true,20),
('Telecel','Telecel 20GB',20480,87.60,73.00,'90 days',true,30),
('Telecel','Telecel 25GB',25600,108.00,90.00,'90 days',true,40),
('Telecel','Telecel 30GB',30720,132.00,110.00,'90 days',true,50),
('Telecel','Telecel 40GB',40960,171.60,143.00,'90 days',true,60),
('Telecel','Telecel 50GB',51200,216.00,180.00,'90 days',true,70);
