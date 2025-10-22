import { NextRequest, NextResponse } from 'next/server'

interface ProductData {
  title: string
  price: number | null
  image_url: string | null
  description: string | null
  brand: string | null
  availability: string | null
  original_url: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    console.log('Processing URL:', url)
    const productData = await extractProductInfo(url)
    console.log('Extracted data:', productData)
    
    return NextResponse.json(productData)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Product URL Parser API',
    testUrls: [
      'https://www.amazon.com/dp/B08N5WRWNW',
      'https://www.etsy.com/listing/123456789',
      'https://www.target.com/p/12345678',
      'https://www.walmart.com/ip/12345678',
      'https://www.bestbuy.com/site/12345678'
    ],
    debug: 'Check server console for detailed parsing logs'
  })
}

async function extractProductInfo(url: string): Promise<ProductData> {
  const domain = new URL(url).hostname.toLowerCase()
  
  console.log('Parsing URL:', url, 'Domain:', domain)
  
  // Try to fetch the page content for real extraction
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    console.log('Successfully fetched HTML, length:', html.length)
    
    const parsedData = parseProductFromHTML(html, url, domain)
    
    // Only return parsed data if we got meaningful information
    if (parsedData.title && parsedData.title !== `Product from ${domain}` && parsedData.title.length > 5) {
      console.log('Successfully parsed product:', parsedData.title)
      return parsedData
    } else {
      throw new Error('No meaningful data extracted')
    }
  } catch (error) {
    console.log('Failed to fetch/parse page, using fallback:', error)
    return getFallbackProductData(url, domain)
  }
}

function parseProductFromHTML(html: string, url: string, domain: string): ProductData {
  console.log('Parsing HTML for domain:', domain, 'HTML length:', html.length)
  
  // Extract title
  const title = extractTitle(html, domain)
  console.log('Extracted title:', title)
  
  // Extract price
  const price = extractPrice(html, domain)
  console.log('Extracted price:', price)
  
  // Extract image
  const image_url = extractImage(html, domain)
  console.log('Extracted image:', image_url)
  
  // Extract description
  const description = extractDescription(html, domain)
  console.log('Extracted description:', description)
  
  // Extract brand
  const brand = extractBrand(html, domain)
  console.log('Extracted brand:', brand)

  const result = {
    title,
    price,
    image_url,
    description,
    brand,
    availability: 'available',
    original_url: url
  }
  
  console.log('Final parsed result:', result)
  return result
}

function extractTitle(html: string, domain: string): string {
  // Try multiple patterns to find the title
  const patterns = [
    // Open Graph title
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    // Twitter title
    /<meta[^>]*name="twitter:title"[^>]*content="([^"]+)"/i,
    // Standard title tag
    /<title[^>]*>([^<]+)<\/title>/i,
    // Amazon specific
    /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
    // Generic h1
    /<h1[^>]*>([^<]+)<\/h1>/i,
    // JSON-LD structured data
    /"name"\s*:\s*"([^"]+)"/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const title = cleanText(match[1])
      if (title.length > 5 && !title.includes('Error') && !title.includes('404')) {
        // Remove common suffixes
        return title
          .replace(/\s*:\s*Amazon\.com.*$/i, '')
          .replace(/\s*-\s*Amazon\.com.*$/i, '')
          .replace(/\s*\|\s*.*$/i, '')
          .trim()
      }
    }
  }

  return `Product from ${domain}`
}

function extractPrice(html: string, domain: string): number | null {
  // Try multiple price patterns
  const patterns = [
    // Structured data
    /"price"\s*:\s*"?(\d+(?:\.\d{2})?)"?/i,
    // Meta tags
    /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
    // Currency symbols
    /\$(\d+(?:\.\d{2})?)/g,
    // Amazon specific
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>(\d+)<\/span>/i,
    // Generic price spans
    /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
  ]

  for (const pattern of patterns) {
    const matches = html.match(pattern)
    if (matches) {
      const priceStr = matches[1] || matches[0]
      const price = parseFloat(priceStr.replace(/[^\d.]/g, ''))
      if (!isNaN(price) && price > 0 && price < 10000) { // Reasonable price range
        return price
      }
    }
  }

  return null
}

function extractImage(html: string, domain: string): string | null {
  console.log('Extracting image from domain:', domain)
  
  // Try multiple image patterns in order of preference
  const patterns = [
    // Open Graph image (highest priority - usually the best product image)
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    // Twitter image
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
    // Amazon specific - main product image
    /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
    // Amazon specific - product image in various formats
    /<img[^>]*data-old-hires="([^"]+)"/i,
    /<img[^>]*data-a-dynamic-image[^>]*src="([^"]+)"/i,
    // Generic product images
    /<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*main[^"]*"[^>]*src="([^"]+)"/i,
    // Any img tag with src (last resort)
    /<img[^>]*src="([^"]+)"[^>]*>/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let imageUrl = match[1]
      
      // Clean up the URL
      imageUrl = imageUrl.replace(/&amp;/g, '&')
      
      console.log('Found potential image:', imageUrl)
      
      // Validate image URL
      if (imageUrl.startsWith('http') && 
          (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp') || imageUrl.includes('amazon') || imageUrl.includes('etsy'))) {
        console.log('Valid image found:', imageUrl)
        return imageUrl
      }
    }
  }

  console.log('No valid image found')
  return null
}

function extractDescription(html: string, domain: string): string | null {
  // Try multiple description patterns
  const patterns = [
    // Open Graph description
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    // Meta description
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    // Twitter description
    /<meta[^>]*name="twitter:description"[^>]*content="([^"]+)"/i,
    // JSON-LD description
    /"description"\s*:\s*"([^"]+)"/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const description = cleanText(match[1])
      if (description.length > 10 && description.length < 500) {
        return description
      }
    }
  }

  return null
}

function extractBrand(html: string, domain: string): string | null {
  // Try multiple brand patterns
  const patterns = [
    // JSON-LD brand
    /"brand"\s*:\s*"([^"]+)"/i,
    // Meta brand
    /<meta[^>]*property="product:brand"[^>]*content="([^"]+)"/i,
    // Amazon specific
    /<a[^>]*id="bylineInfo"[^>]*>([^<]+)<\/a>/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const brand = cleanText(match[1])
      if (brand.length > 1 && brand.length < 50) {
        return brand
      }
    }
  }

  return null
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFallbackProductData(url: string, domain: string): ProductData {
  // Simple fallback based on domain
  const fallbackData: Record<string, Partial<ProductData>> = {
    'amazon.com': {
      title: 'Amazon Product',
      price: 29.99,
      image_url: 'https://via.placeholder.com/300x300/0066CC/FFFFFF?text=Amazon+Product',
      description: 'Product from Amazon',
      brand: 'Amazon'
    },
    'etsy.com': {
      title: 'Etsy Handmade Item',
      price: 45.00,
      image_url: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Etsy+Item',
      description: 'Handmade item from Etsy',
      brand: 'Etsy Seller'
    },
    'target.com': {
      title: 'Target Product',
      price: 19.99,
      image_url: 'https://via.placeholder.com/300x300/CC0000/FFFFFF?text=Target+Product',
      description: 'Product from Target',
      brand: 'Target'
    },
    'walmart.com': {
      title: 'Walmart Product',
      price: 24.99,
      image_url: 'https://via.placeholder.com/300x300/004C91/FFFFFF?text=Walmart+Product',
      description: 'Product from Walmart',
      brand: 'Walmart'
    },
    'bestbuy.com': {
      title: 'Best Buy Product',
      price: 199.99,
      image_url: 'https://via.placeholder.com/300x300/003DA5/FFFFFF?text=Best+Buy+Product',
      description: 'Electronics from Best Buy',
      brand: 'Best Buy'
    }
  }

  const domainKey = domain.replace('www.', '')
  const fallback = fallbackData[domainKey] || {
    title: `Product from ${domain}`,
    price: 25.00,
    image_url: 'https://via.placeholder.com/300x300/666666/FFFFFF?text=Product',
    description: `Product from ${domain}`,
    brand: domain.charAt(0).toUpperCase() + domain.slice(1)
  }

  return {
    title: fallback.title || 'Product',
    price: fallback.price || null,
    image_url: fallback.image_url || null,
    description: fallback.description || null,
    brand: fallback.brand || null,
    availability: 'available',
    original_url: url
  }
}