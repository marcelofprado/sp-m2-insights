# São Paulo m² Insights - Setup Guide

## Project Overview

This is a new project for São Paulo, based on the Rio de Janeiro m² insights website. It shows real estate price per square meter data using ITBI (Imposto de Transmissão de Bens Imóveis) data from the São Paulo city government.

## Project Structure

```
sp-m2-insights/
├── public/
│   ├── robots.txt          # SEO robots file
│   └── sitemap.xml         # SEO sitemap
├── src/
│   ├── api/
│   │   └── itbi.ts        # API data fetching logic
│   ├── components/
│   │   ├── SearchBar.tsx  # Search component (updated for SP)
│   │   ├── PriceChart.tsx # Price chart visualization
│   │   └── Insights.tsx   # Insights cards
│   ├── styles/
│   │   └── index.css      # Tailwind CSS styles
│   ├── App.tsx            # Main app component (updated for SP)
│   └── main.tsx           # React entry point
├── index.html             # HTML template (updated for SP)
├── package.json           # Dependencies
├── vite.config.ts         # Vite config (port 5174)
├── tsconfig.json          # TypeScript config
├── tailwind.config.cjs    # Tailwind CSS config
├── postcss.config.cjs     # PostCSS config
├── .gitignore            # Git ignore file
├── README.md             # Project documentation
└── SETUP.md              # This file

```

## Important Changes from Rio Project

### 1. Branding & Text
- All references changed from "Rio de Janeiro" to "São Paulo"
- Search placeholders updated (e.g., "Av. Paulista, Jardins, Vila Madalena")
- Footer links updated to São Paulo data sources
- Meta tags and SEO updated for São Paulo

### 2. Development Port
- Changed from `5173` (Rio) to `5174` (São Paulo) to allow running both projects simultaneously

### 3. API Configuration
⚠️ **ACTION REQUIRED**: The API endpoint is currently a placeholder!

You need to update:
- `src/api/itbi.ts` - Update the `BASE` constant with actual São Paulo ITBI data URL
- `vite.config.ts` - Update the proxy target and rewrite path

## Next Steps

### 1. Find São Paulo ITBI Data Source

Research and find the official São Paulo ITBI open data endpoint. Possible sources:

- **Dados Abertos SP**: https://dados.prefeitura.sp.gov.br/
- **GeoSampa**: http://geosampa.prefeitura.sp.gov.br/
- Look for ArcGIS REST services or similar APIs
- Check for CSV/JSON endpoints with ITBI transaction data

The data should include:
- Street name (logradouro)
- Neighborhood (bairro)
- Transaction date (year/month)
- Property value (valor do imóvel)
- Built area (área construída)
- Property type (residential/commercial)

### 2. Update API Configuration

Once you find the data source, update these files:

**src/api/itbi.ts**:
```typescript
const BASE = import.meta.env.DEV
  ? '/api'
  : 'https://ACTUAL-SP-DATA-SOURCE-URL.sp.gov.br/api/endpoint'
```

**vite.config.ts**:
```typescript
proxy: {
  '/api': {
    target: 'https://ACTUAL-SP-DATA-SOURCE-URL.sp.gov.br',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/ACTUAL-PATH'),
    secure: false
  }
}
```

### 3. Verify Data Structure

The data parsing in `src/api/itbi.ts` assumes certain field names:
- `logradouro` (street)
- `bairro` (neighborhood)
- `ano_transação` / `ano_transacao` (year)
- `mês_transação` / `mes_transacao` (month)
- `média_valor_imóvel` / `media_valor_imovel` (average property value)
- `média_área_construída` / `media_area_construida` (average built area)
- `total_transações` / `total_transacoes` (transaction count)
- `uso` (usage: RESIDENCIAL or NAO RESIDENCIAL)

If the São Paulo data has different field names, update the `parseFeaturesForRecords` function.

### 4. Install Dependencies

```bash
cd sp-m2-insights
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### 6. Update Google Tag Manager

Replace the placeholder GTM ID in `index.html`:
```html
<!-- Change GTM-XXXXXXXX to your actual GTM ID -->
```

### 7. Build for Production

```bash
npm run build
```

The production files will be in the `dist/` folder.

## Deployment

Update the following before deploying:
1. Google Tag Manager ID in `index.html`
2. Canonical URL in `index.html` (currently set to https://sp.diodorus.com.br/)
3. Sitemap URL in `public/robots.txt`
4. Last modified date in `public/sitemap.xml`

## Testing Checklist

- [ ] Data loads successfully from São Paulo ITBI source
- [ ] Search finds streets and neighborhoods correctly
- [ ] Price chart displays data for last 24 months
- [ ] Insights cards show correct calculations
- [ ] Residential/Commercial toggle filters work
- [ ] SEO meta tags are correct
- [ ] Google Tag Manager tracks events
- [ ] Mobile responsive design works
- [ ] Error handling displays user-friendly messages

## Differences from Rio Project

| Feature | Rio | São Paulo |
|---------|-----|-----------|
| Dev Port | 5173 | 5174 |
| Data Source | Rio ArcGIS ITBI | **TO BE CONFIGURED** |
| Branding | Rio de Janeiro | São Paulo |
| Example Streets | Copacabana, Leblon | Jardins, Vila Madalena |
| Domain | rio.diodorus.com.br | sp.diodorus.com.br |

## Support

For issues or questions, refer to the Rio project as reference or check the main README.md file.
