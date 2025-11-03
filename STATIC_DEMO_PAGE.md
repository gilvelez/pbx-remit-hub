# Static Plaid Demo Page - pbx-demo.html

## Overview
Standalone HTML page for testing Plaid integration - no React, no build process, pure vanilla JavaScript.

## Files Created

### 1. `frontend/public/pbx-demo.html`
**URL:** `https://philippinebayaniexchange.com/pbx-demo.html`

**Features:**
- ✅ Self-contained single HTML file
- ✅ No dependencies (except Plaid CDN)
- ✅ Inline CSS and JavaScript
- ✅ Same functionality as React LinkDemo
- ✅ Works directly from public/ folder

**Benefits:**
- **Simple:** No build process required
- **Fast:** Direct HTML access, instant load
- **Portable:** Can be deployed anywhere
- **Debuggable:** All code visible in browser
- **Standalone:** No React/Node dependencies

### 2. `frontend/public/_redirects`
**Purpose:** Netlify redirect rules for SPA routing

**Content:**
```
/*  /index.html  200
```

**What it does:**
- Redirects all routes to `index.html`
- Allows React Router to handle client-side routing
- Preserves direct access to static files (like `pbx-demo.html`)

## How It Works

### Static File vs React Route

**Static files (like pbx-demo.html):**
- Accessed directly: `https://site.com/pbx-demo.html`
- Served from `frontend/public/` folder
- No routing needed
- Loads instantly

**React routes (like /link-demo):**
- Accessed as: `https://site.com/link-demo`
- Redirected to `index.html` by `_redirects`
- React Router handles the route
- React app loads first

### Architecture

```
Request: /pbx-demo.html
└─> Netlify checks: Is this a real file?
    └─> YES → Serve pbx-demo.html directly ✅

Request: /link-demo
└─> Netlify checks: Is this a real file?
    └─> NO → Apply _redirects rule
        └─> Serve index.html
            └─> React Router handles /link-demo ✅
```

## Usage

### Access the Static Demo
```
https://philippinebayaniexchange.com/pbx-demo.html
```

### Testing Workflow
1. **Visit:** `https://philippinebayaniexchange.com/pbx-demo.html`
2. **Click:** "Alt: Sandbox Public Token" (instant test)
3. **Click:** "3) Exchange → Access"
4. **Test:** Balances / Auth / Identity

### Full UI Flow
1. **Click:** "1) Create Link Token"
2. **Click:** "2) Open Link (UI)"
3. **Select:** Bank and enter credentials
4. **Click:** "3) Exchange → Access"
5. **Test:** All data endpoints

## Code Structure

### HTML Structure
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PBX • Plaid Demo</title>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <style>/* Inline CSS */</style>
</head>
<body>
  <h1>PBX • Plaid Demo (Static)</h1>
  <div class="row">
    <button id="btn-link">1) Create Link Token</button>
    <!-- More buttons -->
  </div>
  <small id="state"><!-- Token state display --></small>
  <pre id="out"><!-- JSON output --></pre>
  <script>/* Inline JavaScript */</script>
</body>
</html>
```

### JavaScript Logic

#### Helper Functions
```javascript
// Display output
const out = v => document.getElementById("out").textContent = 
  typeof v === "string" ? v : JSON.stringify(v,null,2);

// Update state display
const setState = s => document.getElementById("state").textContent =
  `link_token: ${s.lt||"—"} · public_token: ${s.pt||"—"} · access_token: ${s.at?"(stored)":"—"}`;

// State management
let state={lt:"",pt:"",at:""};
const set=p=>{state={...state,...p};setState(state);};

// API call helper
const call = async (fn, body={}) => {
  const r = await fetch(`/.netlify/functions/${fn}`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const t = await r.text();
  try { return {ok:r.ok,data:JSON.parse(t)} }
  catch { return {ok:r.ok,data:t} }
};
```

#### Button Handlers
```javascript
// Create Link Token
document.getElementById("btn-link").onclick = async () => {
  out("calling create-link-token…");
  const r = await call("create-link-token");
  out(r.data);
  if (r.ok && r.data.link_token){
    set({lt:r.data.link_token});
    document.getElementById("btn-open").disabled=false;
  }
};

// Open Plaid Link UI
document.getElementById("btn-open").onclick = () => {
  if (!window.Plaid) return out({error:"Plaid script not loaded"});
  if (!state.lt) return out({error:"No link_token yet"});
  
  const handler = window.Plaid.create({
    token: state.lt,
    onSuccess: (public_token) => {
      set({pt:public_token});
      out({public_token});
      document.getElementById("btn-exchange").disabled=false;
    },
    onExit: (err) => {
      if (err) out({exit:err});
    }
  });
  handler.open();
};

// And so on for other buttons...
```

## Comparison: Static vs React

### Static HTML (`pbx-demo.html`)
**Pros:**
- ✅ No build process
- ✅ Works anywhere (any server)
- ✅ Instant load
- ✅ Easy to debug
- ✅ Self-contained

**Cons:**
- ❌ No hot reload in development
- ❌ No component reusability
- ❌ No TypeScript/JSX
- ❌ Manual DOM manipulation

**Best for:**
- Quick testing
- Demos/presentations
- Debugging
- Minimal deployments

### React Component (`/link-demo`)
**Pros:**
- ✅ Hot reload
- ✅ Component reusability
- ✅ Better state management
- ✅ Integrated with app
- ✅ Modern tooling

**Cons:**
- ❌ Build process required
- ❌ React dependencies
- ❌ Slower initial load
- ❌ More complex setup

**Best for:**
- Production features
- Complex UIs
- Team development
- Scalable apps

## Security

### Both Versions are Secure ✅

**Static HTML:**
```javascript
// Calls serverless functions (same as React)
const r = await fetch(`/.netlify/functions/create-link-token`, {...});
```

**React Component:**
```javascript
// Also calls serverless functions
const data = await postJSON("create-link-token", {});
```

**Result:**
- ✅ No PLAID secrets in frontend
- ✅ All credentials server-side
- ✅ Same security model
- ✅ Environment variables protected

## Use Cases

### 1. Quick Testing
```
Developer needs to test Plaid integration
→ Visit pbx-demo.html
→ No build, instant testing
```

### 2. Client Demo
```
Show potential client Plaid integration
→ Send link to pbx-demo.html
→ No app context needed
```

### 3. Debugging
```
Issue with Plaid flow
→ Test with static page
→ Isolate from React complexity
```

### 4. Documentation
```
Team needs reference implementation
→ View pbx-demo.html source
→ All code in one file
```

## Deployment

### Files Added
```
frontend/public/pbx-demo.html  ✅ Created
frontend/public/_redirects     ✅ Created
```

### Netlify Behavior

**Direct file access:**
```
GET /pbx-demo.html
→ Serves frontend/public/pbx-demo.html directly
→ No redirect rule applied
→ Returns HTML file
```

**React route access:**
```
GET /link-demo
→ No physical file exists
→ Apply _redirects rule: /* → /index.html
→ React loads and handles /link-demo route
```

**Static assets:**
```
GET /og-image.png
→ Serves frontend/public/og-image.png directly
→ No redirect rule applied
```

## Testing After Deploy

### Test Static Demo
```bash
# Should return HTML content
curl https://philippinebayaniexchange.com/pbx-demo.html
```

### Test React Route
```bash
# Should return index.html (React app)
curl https://philippinebayaniexchange.com/link-demo
```

### Test Functions
```bash
# Should work from both pages
curl -X POST https://philippinebayaniexchange.com/.netlify/functions/sandbox-public-token
```

## Access URLs

After deployment, you'll have **two** ways to test Plaid:

### 1. Static HTML Page
```
https://philippinebayaniexchange.com/pbx-demo.html
```
- Direct HTML access
- No React
- Instant load
- Self-contained

### 2. React Component
```
https://philippinebayaniexchange.com/link-demo
```
- Full React app
- Integrated UI
- Component-based
- Part of main app

**Both use the same 7 Netlify functions:**
1. create-link-token
2. exchange-public-token
3. sandbox-public-token
4. accounts-balance
5. transactions-sync
6. accounts-auth
7. identity

## Troubleshooting

### Issue: pbx-demo.html returns 404
**Cause:** File not in `frontend/public/` folder
**Solution:** Verify file exists in public folder and rebuild

### Issue: React routes return 404
**Cause:** Missing or incorrect `_redirects` file
**Solution:** Ensure `_redirects` contains: `/*  /index.html  200`

### Issue: Functions not working
**Cause:** PLAID environment variables not set
**Solution:** Set in Netlify dashboard: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV

### Issue: Plaid Link modal not opening
**Cause:** Plaid CDN script not loaded
**Solution:** Check browser console, verify CDN URL is correct

## Advantages of Static Demo

1. **No Dependencies:**
   - Works without Node.js
   - No npm install needed
   - No build process

2. **Portable:**
   - Copy to any server
   - Works on GitHub Pages
   - Can be emailed as attachment

3. **Debuggable:**
   - All code visible
   - No minification
   - Easy to understand

4. **Fast:**
   - Instant load
   - No JavaScript bundle
   - Minimal overhead

5. **Reliable:**
   - No breaking changes
   - No dependency updates
   - Just HTML/CSS/JS

## Next Steps

### Add Link from Landing Page
```jsx
// In Landing.jsx
<div style={{display: 'flex', gap: 16}}>
  <a href="/link-demo">React Demo →</a>
  <a href="/pbx-demo.html">Static Demo →</a>
</div>
```

### Share with Team
```
Quick Plaid Test:
https://philippinebayaniexchange.com/pbx-demo.html

No setup needed - just click buttons!
```

### Use for Presentations
```
1. Open pbx-demo.html on projector
2. Click through Plaid flow live
3. Show real-time API responses
```

---

## Summary

✅ **Static HTML demo page** created at `/pbx-demo.html`
✅ **Netlify redirects** configured for SPA routing
✅ **Two testing options** available: Static + React
✅ **Same security** as React version
✅ **Same functions** as React version
✅ **Simpler** and more portable

**Access after deploy:**
- Static: `https://philippinebayaniexchange.com/pbx-demo.html`
- React: `https://philippinebayaniexchange.com/link-demo`

**Ready to commit and deploy!** 🚀
