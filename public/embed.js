/**
 * WaveOrder website embed: floating order button.
 * Loaded by a script tag with data-order-url (required) and optional styling attributes.
 */
(function () {
  var script = document.currentScript
  if (!script || !script.getAttribute) return

  var orderUrl = script.getAttribute('data-order-url')
  if (!orderUrl) return

  var label = script.getAttribute('data-label') || 'Order online'
  var bg = script.getAttribute('data-bg') || '#0d9488'
  var color = script.getAttribute('data-color') || '#ffffff'
  var roundedAttr = script.getAttribute('data-rounded')
  var rounded = roundedAttr !== '0' && roundedAttr !== 'false'
  var sizeAttr = (script.getAttribute('data-size') || 'md').toLowerCase()
  var sizes = {
    sm: { padding: '10px 14px', fontSize: '14px' },
    md: { padding: '12px 18px', fontSize: '16px' },
    lg: { padding: '14px 22px', fontSize: '18px' }
  }
  var sz = sizes[sizeAttr] || sizes.md

  var a = document.createElement('a')
  a.href = orderUrl
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.textContent = label
  a.setAttribute('role', 'button')
  a.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'right:24px',
    'z-index:99999',
    'font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'font-weight:600',
    'text-decoration:none',
    'box-shadow:0 4px 14px rgba(0,0,0,0.2)',
    'border:none',
    'cursor:pointer',
    'background:' + bg,
    'color:' + color,
    rounded ? 'border-radius:9999px' : 'border-radius:4px',
    'padding:' + sz.padding,
    'font-size:' + sz.fontSize,
    'line-height:1.2'
  ].join(';')

  if (document.body) {
    document.body.appendChild(a)
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(a)
    })
  }
})()
