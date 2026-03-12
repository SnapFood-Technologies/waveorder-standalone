// components/storefront/MetaPixel.tsx
'use client'

import Script from 'next/script'

interface MetaPixelProps {
  pixelId: string
  enabled: boolean
}

/**
 * Injects Meta (Facebook) Pixel for ad tracking when enabled.
 * Fires PageView on load. Additional events (AddToCart, Purchase) can be
 * fired from storefront components when those actions occur.
 */
export default function MetaPixel({ pixelId, enabled }: MetaPixelProps) {
  if (!enabled || !pixelId || !pixelId.trim()) return null

  const id = pixelId.trim()

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${id}');
            fbq('track', 'PageView');
          `
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
