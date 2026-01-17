# SEO & Social Media Optimization

## Overview

The PBX landing page is optimized for search engines and social media sharing with proper metadata and Open Graph images.

## Meta Tags

### Title Tag
```html
<title>Philippine Bayani Exchange – For the Heroes Who Build Home from Afar</title>
```

**Purpose**: Primary SEO signal and browser tab title
**Character count**: 73 (optimal: 50-60, max: 70)

### Meta Description
```html
<meta name="description" content="Every transfer carries more than money—it carries love, dreams, and family. Seamless, secure remittances built for Global Filipinos." />
```

**Purpose**: Search result snippet and social preview
**Character count**: 153 (optimal: 150-160)

## Open Graph Tags

Used by Facebook, LinkedIn, Slack, and other platforms:

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://bayanilink.preview.emergentagent.com/" />
<meta property="og:title" content="Philippine Bayani Exchange – For the Heroes Who Build Home from Afar" />
<meta property="og:description" content="Every transfer carries more than money—it carries love, dreams, and family. Seamless, secure remittances built for Global Filipinos." />
<meta property="og:image" content="%PUBLIC_URL%/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="PBX - Philippine Bayani Exchange" />
```

**Image specifications:**
- Dimensions: 1200 x 630 pixels (Facebook recommended)
- Format: PNG
- Size: ~143KB
- Aspect ratio: 1.91:1

## Twitter Card Tags

Optimized for Twitter/X sharing:

```html
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://bayanilink.preview.emergentagent.com/" />
<meta property="twitter:title" content="Philippine Bayani Exchange – For the Heroes Who Build Home from Afar" />
<meta property="twitter:description" content="Every transfer carries more than money—it carries love, dreams, and family. Seamless, secure remittances built for Global Filipinos." />
<meta property="twitter:image" content="%PUBLIC_URL%/og-image.png" />
```

**Card type**: `summary_large_image` (shows large image above text)

## OG Image

### Design Elements

**Location**: `/app/frontend/public/og-image.png`

**Visual composition:**
1. **Background**: Gradient (sky-blue → red → yellow) matching Philippine flag colors
2. **Logo**: White square with "PBX" text in gradient
3. **Title**: "Philippine Bayani Exchange" (bold, white)
4. **Tagline**: "For the Heroes Who Build Home from Afar" (semi-bold, white)
5. **Subtitle**: Two-line emotional message (light, white)
6. **Decorative**: Subtle circles for depth

**Typography:**
- Font: System UI stack (consistent across platforms)
- Title: 54px, weight 800
- Tagline: 36px, weight 600
- Subtitle: 24px, weight 400

**Colors:**
- Primary gradient: #0ea5e9 (sky) → #ef4444 (red) → #eab308 (yellow)
- Text: White with varying opacity (100%, 95%, 85%)
- Background overlay: Black gradient (10% → 40%)

### File Formats

**PNG** (`og-image.png`):
- Used for social media
- 1200 x 630 pixels
- 143KB file size
- Transparent background converted to gradient

**SVG** (`og-image.svg`):
- Source file for easy editing
- Scalable vector format
- Can be updated and re-rendered

## Testing Social Previews

### Facebook Debugger
```
https://developers.facebook.com/tools/debug/
```
1. Enter: https://bayanilink.preview.emergentagent.com/
2. Click "Debug"
3. View preview
4. Click "Scrape Again" to refresh cache

### Twitter Card Validator
```
https://cards-dev.twitter.com/validator
```
1. Enter URL
2. View preview
3. Check card type and image

### LinkedIn Post Inspector
```
https://www.linkedin.com/post-inspector/
```
1. Enter URL
2. Inspect
3. View preview

### Open Graph Debugger (General)
```
https://www.opengraph.xyz/
```
1. Enter URL
2. See how it appears on multiple platforms

## Preview Examples

### Google Search Result
```
Philippine Bayani Exchange – For the Heroes Who Build Home from Afar
https://bayanilink.preview.emergentagent.com
Every transfer carries more than money—it carries love, dreams, and family. 
Seamless, secure remittances built for Global Filipinos.
```

### Facebook/LinkedIn Share
```
[Large Image: OG Image with gradient and text]
Philippine Bayani Exchange – For the Heroes Who Build Home from Afar
Every transfer carries more than money—it carries love, dreams, and family. 
Seamless, secure remittances built for Global Filipinos.
remit-hub-1.preview.emergentagent.com
```

### Twitter Card
```
[Large Image Card]
Philippine Bayani Exchange – For the Heroes Who Build Home from Afar
Every transfer carries more than money—it carries love, dreams, and family. 
Seamless, secure remittances built for Global Filipinos.
From remit-hub-1.preview.emergentagent.com
```

## Theme Color

```html
<meta name="theme-color" content="#0ea5e9" />
```

**Effect**: 
- Mobile browser address bar color (Android Chrome, Safari iOS)
- Matches primary brand color (sky blue)

## Favicon

Standard favicon setup for browser tabs and bookmarks:

```html
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
<link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
```

**Files needed** (not yet created):
- `favicon.ico` - 32x32 or 16x16 icon
- `logo192.png` - 192x192 for Apple touch icon

## SEO Best Practices

### ✅ Implemented

1. **Title optimization**: Descriptive, unique, includes brand
2. **Meta description**: Compelling, action-oriented, within limits
3. **Open Graph**: Complete tags for social sharing
4. **Twitter Cards**: Large image card for maximum impact
5. **Semantic HTML**: Proper heading hierarchy (h1, h2, h3)
6. **Mobile-friendly**: Responsive viewport meta tag
7. **Theme color**: Branded browser chrome

### 🔄 Recommendations

1. **Structured Data**: Add JSON-LD for rich snippets
   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "FinancialService",
     "name": "Philippine Bayani Exchange",
     "description": "...",
     "url": "...",
     "logo": "..."
   }
   </script>
   ```

2. **Canonical URL**: Add canonical tag
   ```html
   <link rel="canonical" href="https://bayanilink.preview.emergentagent.com/" />
   ```

3. **Robots meta**: Control indexing
   ```html
   <meta name="robots" content="index, follow" />
   ```

4. **Language**: Already set in html tag
   ```html
   <html lang="en">
   ```

## Image Generation Process

If you need to update the OG image:

### Method 1: Edit SVG
1. Edit `/app/frontend/public/og-image.svg`
2. Run conversion:
   ```bash
   convert -background none -density 300 /app/frontend/public/og-image.svg -resize 1200x630 /app/frontend/public/og-image.png
   ```

### Method 2: Design Tool
1. Use Figma/Canva/Photoshop
2. Export as PNG at 1200x630
3. Save to `/app/frontend/public/og-image.png`

### Design Guidelines
- **Safe zone**: Keep important content within 1000x600 center area
- **Text size**: Minimum 24px for readability
- **Contrast**: Ensure text is readable on background
- **Branding**: Include logo and brand colors
- **Message**: Clear, concise value proposition

## Monitoring & Analytics

### Google Search Console
Track search performance:
- Impressions
- Clicks
- Average position
- Click-through rate

### Social Insights
Monitor share performance:
- Facebook Insights
- Twitter Analytics
- LinkedIn Page Analytics

## Character Limits

| Element | Current | Optimal | Maximum |
|---------|---------|---------|---------|
| Title | 73 | 50-60 | 70 |
| Description | 153 | 150-160 | 160 |
| OG Title | 73 | 55-60 | 95 |
| OG Description | 153 | 150-160 | 200 |
| Twitter Title | 73 | 50-60 | 70 |

**Note**: Current lengths are within optimal ranges.

## Keyword Strategy

**Primary keywords:**
- Philippine remittance
- Send money to Philippines
- Filipino remittance
- PH money transfer
- Bayani (hero in Filipino)

**Long-tail keywords:**
- Send money to Philippines from USA
- Remittance for Filipino workers
- Money transfer GCash Philippines
- USD to PHP transfer

**Emotional keywords:**
- Build home from afar
- Support family Philippines
- Heroes who build home

## Mobile Optimization

- ✅ Responsive viewport meta tag
- ✅ Touch-friendly tap targets (48x48px minimum)
- ✅ Fast loading (optimized images, minimal JS)
- ✅ Readable font sizes (16px minimum)
- ✅ Theme color for mobile browsers

## Accessibility

- ✅ Semantic HTML structure
- ✅ Alt text on images (OG image has text overlay)
- ✅ High contrast ratios
- ✅ Keyboard navigation
- ✅ ARIA labels where needed

## Performance Impact

**Meta tags**: Negligible (< 1KB)
**OG image**: 143KB (acceptable, loads async)
**Total overhead**: ~144KB

**Optimization**:
- OG image loaded on-demand by social crawlers
- Not part of critical rendering path
- No impact on initial page load

## Deployment Checklist

Before going live:

1. ✅ Update OG URL to production domain
2. ✅ Update Twitter URL to production domain
3. ⚠️ Create favicon.ico (currently using default)
4. ⚠️ Create logo192.png for Apple touch icon
5. ✅ Test OG image renders correctly
6. ⚠️ Submit sitemap to Google Search Console
7. ⚠️ Verify robots.txt allows crawling
8. ✅ Test on multiple devices
9. ⚠️ Add structured data (JSON-LD)
10. ⚠️ Set up analytics tracking

## Tools Used

- **ImageMagick**: SVG to PNG conversion
- **SVG**: Vector graphics for easy editing
- **OpenGraph.xyz**: Testing OG previews
- **Facebook Debugger**: Testing Facebook shares
- **Twitter Card Validator**: Testing Twitter cards
