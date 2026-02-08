/**
 * Domain Provisioning Utilities
 * 
 * Handles SSL certificate provisioning and Nginx configuration
 * by executing server-side scripts on the Azure VPS.
 * 
 * For development/testing, these operations are simulated.
 * In production, they execute actual shell scripts.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

// Script paths on the server
const SCRIPTS_PATH = process.env.DOMAIN_SCRIPTS_PATH || '/opt/waveorder/scripts'
const PROVISION_SCRIPT = `${SCRIPTS_PATH}/provision-domain.sh`
const REMOVE_SCRIPT = `${SCRIPTS_PATH}/remove-domain.sh`
const VERIFY_SCRIPT = `${SCRIPTS_PATH}/verify-dns.sh`

// Whether we're in production mode (can execute server scripts)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Log provisioning activity
 */
function logProvisioning(action: string, domain: string, details: any) {
  console.log(`[Domain Provisioning] ${action} - ${domain}`, details)
}

/**
 * Provision SSL certificate and Nginx configuration for a domain
 * @param domain - The custom domain to provision
 * @param businessSlug - The business slug for routing
 * @returns Provisioning result
 */
export async function provisionDomain(
  domain: string,
  businessSlug: string
): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  logProvisioning('PROVISION_START', domain, { businessSlug })
  
  // In development, simulate success
  if (!IS_PRODUCTION) {
    logProvisioning('PROVISION_DEV_MODE', domain, { message: 'Simulated success in development' })
    return {
      success: true,
      message: 'Domain provisioned successfully (development mode)'
    }
  }
  
  try {
    // Execute the provisioning script
    const { stdout, stderr } = await execAsync(
      `sudo ${PROVISION_SCRIPT} "${domain}" "${businessSlug}"`,
      { timeout: 120000 } // 2 minute timeout for SSL provisioning
    )
    
    logProvisioning('PROVISION_STDOUT', domain, { stdout })
    
    if (stderr && !stderr.includes('SUCCESS')) {
      logProvisioning('PROVISION_STDERR', domain, { stderr })
    }
    
    // Check for success indicator in output
    if (stdout.includes('SUCCESS') || stdout.includes('provisioned successfully')) {
      return {
        success: true,
        message: 'Domain provisioned successfully with SSL certificate'
      }
    }
    
    // If we get here without SUCCESS, something may have gone wrong
    return {
      success: false,
      message: 'Provisioning completed but status unclear',
      error: stderr || 'Check server logs for details'
    }
    
  } catch (error: any) {
    logProvisioning('PROVISION_ERROR', domain, { error: error.message })
    
    return {
      success: false,
      message: 'Failed to provision domain',
      error: error.message || 'Unknown error during provisioning'
    }
  }
}

/**
 * Remove a domain's SSL certificate and Nginx configuration
 * @param domain - The custom domain to remove
 * @returns Removal result
 */
export async function removeDomain(domain: string): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  logProvisioning('REMOVE_START', domain, {})
  
  // In development, simulate success
  if (!IS_PRODUCTION) {
    logProvisioning('REMOVE_DEV_MODE', domain, { message: 'Simulated success in development' })
    return {
      success: true,
      message: 'Domain removed successfully (development mode)'
    }
  }
  
  try {
    const { stdout, stderr } = await execAsync(
      `sudo ${REMOVE_SCRIPT} "${domain}"`,
      { timeout: 30000 } // 30 second timeout
    )
    
    logProvisioning('REMOVE_STDOUT', domain, { stdout })
    
    if (stderr) {
      logProvisioning('REMOVE_STDERR', domain, { stderr })
    }
    
    if (stdout.includes('SUCCESS') || stdout.includes('removed successfully')) {
      return {
        success: true,
        message: 'Domain removed successfully'
      }
    }
    
    return {
      success: false,
      message: 'Removal completed but status unclear',
      error: stderr || 'Check server logs for details'
    }
    
  } catch (error: any) {
    logProvisioning('REMOVE_ERROR', domain, { error: error.message })
    
    return {
      success: false,
      message: 'Failed to remove domain',
      error: error.message || 'Unknown error during removal'
    }
  }
}

/**
 * Verify DNS is properly configured (using server-side script)
 * @param domain - Domain to verify
 * @returns Verification result
 */
export async function verifyDNSWithScript(domain: string): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  // In development, always return success
  if (!IS_PRODUCTION) {
    return {
      success: true,
      message: 'DNS verified (development mode)'
    }
  }
  
  try {
    const { stdout, stderr } = await execAsync(
      `${VERIFY_SCRIPT} "${domain}"`,
      { timeout: 15000 }
    )
    
    // Script exits with 0 if DNS is correct
    if (stdout.includes('✓') && !stdout.includes('✗')) {
      return {
        success: true,
        message: 'DNS configuration verified'
      }
    }
    
    return {
      success: false,
      message: 'DNS not properly configured',
      error: stdout || stderr
    }
    
  } catch (error: any) {
    return {
      success: false,
      message: 'DNS verification failed',
      error: error.message
    }
  }
}

/**
 * Update domain status in database after provisioning attempt
 * @param businessId - Business ID
 * @param status - New domain status
 * @param error - Optional error message
 */
export async function updateDomainStatus(
  businessId: string,
  status: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED',
  error?: string
): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      domainStatus: status,
      domainLastChecked: new Date(),
      domainError: error || null,
      ...(status === 'ACTIVE' ? { domainProvisionedAt: new Date() } : {}),
      ...(status === 'NONE' ? { 
        customDomain: null,
        domainVerificationToken: null,
        domainVerificationExpiry: null,
        domainProvisionedAt: null,
        domainError: null
      } : {})
    }
  })
}

/**
 * Full domain provisioning workflow
 * 1. Verify DNS is configured
 * 2. Provision SSL and Nginx
 * 3. Update database status
 * 
 * @param businessId - Business ID
 * @param domain - Custom domain
 * @param businessSlug - Business slug for routing
 * @param verificationToken - TXT record verification token
 * @returns Workflow result
 */
export async function fullDomainProvisioningWorkflow(
  businessId: string,
  domain: string,
  businessSlug: string,
  verificationToken: string
): Promise<{
  success: boolean
  status: 'PENDING' | 'ACTIVE' | 'FAILED'
  message: string
  error?: string
}> {
  try {
    // Import here to avoid circular dependency
    const { checkDNSConfiguration } = await import('./domain-verification')
    
    // Step 1: Verify DNS configuration
    const dnsCheck = await checkDNSConfiguration(domain, verificationToken)
    
    if (!dnsCheck.dnsConfigured) {
      await updateDomainStatus(businessId, 'PENDING', dnsCheck.errors.join('; '))
      return {
        success: false,
        status: 'PENDING',
        message: 'DNS not properly configured',
        error: dnsCheck.errors.join('; ')
      }
    }
    
    // Step 2: Provision SSL and Nginx
    const provisionResult = await provisionDomain(domain, businessSlug)
    
    if (!provisionResult.success) {
      await updateDomainStatus(businessId, 'FAILED', provisionResult.error)
      return {
        success: false,
        status: 'FAILED',
        message: 'SSL provisioning failed',
        error: provisionResult.error
      }
    }
    
    // Step 3: Update database to ACTIVE
    await updateDomainStatus(businessId, 'ACTIVE')
    
    return {
      success: true,
      status: 'ACTIVE',
      message: 'Domain successfully provisioned and active'
    }
    
  } catch (error: any) {
    await updateDomainStatus(businessId, 'FAILED', error.message)
    return {
      success: false,
      status: 'FAILED',
      message: 'Provisioning workflow failed',
      error: error.message
    }
  }
}
