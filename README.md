# SP m² Insights

A fast, modern frontend showing m² price insights for São Paulo (ITBI dataset).

## Features
- Search by street
- Last 24 months median R$/m² chart + monthly transaction counts
- Trend assessment (up/down/flat)
- Peak detection (possible empreendimentos released)

## Run
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open `http://localhost:5174`

## Notes
- The app fetches data from the São Paulo ITBI endpoint. First load may take time if the dataset is large.
- Field names in the dataset vary; parsing uses heuristics for date/value/area/address.
- **TODO**: Update the API endpoint in `src/api/itbi.ts` with the actual São Paulo open data source URL.
- Improvements: server-side filtering, full-text address index, caching, better peak detection and smoothing.

## Data Source Configuration

This project needs to be configured with the actual São Paulo ITBI data source. You'll need to:

1. Find the São Paulo open data portal ITBI endpoint
2. Update the `BASE` constant in `src/api/itbi.ts`
3. Update the proxy configuration in `vite.config.ts`
4. Verify the field names match your data source (adjust parsing if needed)

Possible data sources to explore:
- [Dados Abertos SP](https://dados.prefeitura.sp.gov.br/)
- [GeoSampa](http://geosampa.prefeitura.sp.gov.br/)
