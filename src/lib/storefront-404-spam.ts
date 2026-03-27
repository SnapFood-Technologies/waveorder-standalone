/**
 * Classify storefront URL slugs that are scanner / probe traffic (not real store lookups).
 * Used by SuperAdmin system logs + scanner traffic views to hide noise from the main feed.
 *
 * Combines: file-extension probes, structural patterns, known paths, and a curated
 * "probe segment" list (single-path scanner hits like laravel, nginx_status, php).
 */

// Shared spam detection for scanner/bot 404 traffic.
// Instead of maintaining an ever-growing exact list, we combine:
//   1. File extension patterns (catches .php, .php7, .yaml, .cfg, etc.)
//   2. Structural patterns (port numbers, brackets, slashes, wildcards)
//   3. Known exact slugs for common attack paths
//   4. Prefix rules (., _, :, [ etc.)
//   5. Framework / status / probe single-segment paths (see SPAM_PROBE_EXACT_SLUGS)

export const spamFilePatterns =
  /\.(php\d?|png|ico|xml|txt|js|css|svg|jpg|jpeg|gif|webp|json|html?|asp|aspx|jsp|cgi|env|sql|bak|log|zip|tar|gz|git|htaccess|htpasswd|ds_store|gitignore|npmrc|dockerignore|yaml|yml|cfg|ini|conf|toml|sh|bash|bat|ps1|rb|py|pl|lua|map|woff2?|ttf|eot|swf|class|jar|war|pem|key|crt|vcl|config|credentials|backup|old|rar|tgz|md|rdb|tf|tfvars|tfstate|properties|lock|dist|swp|save|gradle|secret|axd|flag)$/i

export const spamStructuralPatterns: RegExp[] = [
  /^\d+$/,
  /^:\d+/,
  /\[/,
  /\*/,
  /\.\./,
  /^(upload|uploads|fileupload|file-upload|uploadfile)$/i,
  /^(import|export|migrate|migration|seed|seeder)$/i,
  /^(controlpanel|cpanel|webmail|plesk|directadmin)$/i,
  /^(package-updates|update|updates|upgrade)$/i,
  /^(alfa|alfanew|alfa-rex|shell|r57|c99|b374k)/i,
  /^(stripe\.yaml|stripe\.json|config\.|\.config)/i,
  /~$/,
  /\.php-/i,
  /-bak/i,
]

/** Single-segment paths scanners use (frameworks, status endpoints, junk). */
export const SPAM_PROBE_EXACT_SLUGS: readonly string[] = [
  // User-reported scanner hits (storefront 404 slug = path segment)
  'src',
  'leader',
  'laravel-graphql-playground',
  'laravel',
  'logging',
  'loggers',
  'logfile',
  'manage',
  'nginx_status',
  'node_stats',
  'node_info',
  'maintenance.flag',
  'package',
  'php-opcache-status',
  'php',
  'perl-status',
  'phpstan.neon',
  'awstats',
  'backend',
  'anything_here',
  'staticfiles',
  'graphql-playground',
  'graphiql',
  'swagger-ui',
  'telescope',
  'horizon',
  'server-status',
  'server_info',
  'healthz',
  'actuator',
  'solr',
  'jmx-console',
  'invoker',
  'j_security_check',
  'aws-codecommit',
  'balancer-manager',
  'careers_not_hosted',
]

const spamExactSlugs = new Set([
  'wp-admin',
  'wp-login',
  'wp-content',
  'wp-includes',
  'administrator',
  'admin',
  'admin_',
  'phpmyadmin',
  'cpanel',
  '.git',
  '.env',
  '.aws',
  'config',
  'backup',
  'db',
  'database',
  'mysql',
  'phpinfo',
  'info',
  'test',
  'debug',
  'shell',
  'cmd',
  'eval',
  'exec',
  'system',
  'passwd',
  'etc',
  'proc',
  'boot',
  'root',
  'tmp',
  'var',
  'usr',
  'bin',
  'cgi-bin',
  'scripts',
  'includes',
  'vendor',
  'node_modules',
  '.well-known',
  'xmlrpc',
  'wp-json',
  'api',
  'robots',
  'sitemap',
  'favicon',
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
  'browserconfig',
  'crossdomain',
  'clientaccesspolicy',
  'dashboard',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'auth',
  'account',
  'profile',
  'settings',
  'setup',
  'install',
  'superadmin',
  'management',
  'secure',
  'getcmd',
  '_next',
  '1',
  'feed',
  'cookie',
  'chatgpt-user',
  'anthropic-ai',
  'claude-web',
  'ccbot',
  'gptbot',
  'version',
  'license',
  'changelog',
  'readme',
  'graphql',
  'jenkinsfile',
  'access_log',
  'error_log',
  'pipfile',
  'aws_credentials',
  'credentials',
  'artisan',
  'makefile',
  'dockerfile',
  'gemfile',
  'server-info',
  'wp-config',
  'enhancecp',
  ...SPAM_PROBE_EXACT_SLUGS,
])

/** Extra regexes for probe families without listing every slug. */
const spamProbePatterns: RegExp[] = [
  /^laravel/i,
  /^node_/i,
  /^nginx/i,
  /^php-/i,
  /^perl-/i,
  /^phpstan/i,
  /^maintenance\./i,
  /^env\./i,
  /^php\.ini/i,
  /^\.env/i,
]

export function isSpamSlug(s: string | null | undefined): boolean {
  if (!s) return false
  const lower = s.toLowerCase()
  // Path-shaped "slugs" (e.g. /.git/config) are probes, not storefront segments.
  if (lower.includes('/')) return true
  if (lower.includes('.git')) return true
  if (lower.includes('codecommit')) return true
  if (lower.startsWith('.') || lower.startsWith('_') || lower.startsWith(':')) return true
  if (spamFilePatterns.test(lower)) return true
  if (spamExactSlugs.has(lower)) return true
  for (const pattern of spamStructuralPatterns) {
    if (pattern.test(lower)) return true
  }
  for (const pattern of spamProbePatterns) {
    if (pattern.test(lower)) return true
  }
  return false
}
