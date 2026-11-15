CREATE ROLE sqli_demo_reader
WITH LOGIN PASSWORD 'prava_lozinka_je_u_.env';


GRANT CONNECT ON DATABASE web2_projekt2
TO sqli_demo_reader;

GRANT USAGE ON SCHEMA public
TO sqli_demo_reader;

GRANT SELECT ON TABLE public.notes
TO sqli_demo_reader;