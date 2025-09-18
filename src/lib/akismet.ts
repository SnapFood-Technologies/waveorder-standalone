// src/lib/akismet.ts - Updated for WaveOrder
interface SpamCheckData {
    user_ip: string;
    user_agent: string;
    author: string;
    author_email: string;
    content: string;
    type: string;
  }
  
  interface SpamCheckResult {
    isSpam: boolean;
    confidence?: number;
  }
  
  export async function checkSpam(data: SpamCheckData): Promise<SpamCheckResult> {
    if (!process.env.AKISMET_API_KEY) {
      console.warn('Akismet API key not configured, skipping spam check');
      return { isSpam: false };
    }
  
    try {
      const params = new URLSearchParams({
        blog: process.env.NEXTAUTH_URL || 'https://waveorder.app',
        user_ip: data.user_ip,
        user_agent: data.user_agent,
        comment_type: data.type,
        comment_author: data.author,
        comment_author_email: data.author_email,
        comment_content: data.content,
        // Additional Akismet parameters
        referrer: '', // Can be passed in if available
        permalink: `${process.env.NEXTAUTH_URL}/contact`,
        comment_date_gmt: new Date().toISOString(),
      });
  
      const response = await fetch(
        `https://${process.env.AKISMET_API_KEY}.rest.akismet.com/1.1/comment-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'WaveOrder/1.0 | Akismet/Node.js'
          },
          body: params.toString(),
        }
      );
  
      if (!response.ok) {
        throw new Error(`Akismet API error: ${response.status}`);
      }
  
      const result = await response.text();
      
      // Get the X-akismet-pro-tip header for additional info
      const proTip = response.headers.get('X-akismet-pro-tip');
      
      return {
        isSpam: result === 'true',
        confidence: proTip === 'discard' ? 1.0 : result === 'true' ? 0.8 : 0.1
      };
    } catch (error) {
      console.error('Akismet check failed:', error);
      return { isSpam: false }; // Fail open - don't block legitimate submissions
    }
  }
  
  export async function submitSpam(data: SpamCheckData): Promise<boolean> {
    if (!process.env.AKISMET_API_KEY) {
      return false;
    }
  
    try {
      const params = new URLSearchParams({
        blog: process.env.NEXTAUTH_URL || 'https://waveorder.app',
        user_ip: data.user_ip,
        user_agent: data.user_agent,
        comment_type: data.type,
        comment_author: data.author,
        comment_author_email: data.author_email,
        comment_content: data.content,
      });
  
      const response = await fetch(
        `https://${process.env.AKISMET_API_KEY}.rest.akismet.com/1.1/submit-spam`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'WaveOrder/1.0 | Akismet/Node.js'
          },
          body: params.toString(),
        }
      );
  
      return response.ok;
    } catch (error) {
      console.error('Failed to submit spam to Akismet:', error);
      return false;
    }
  }
  
  export async function submitHam(data: SpamCheckData): Promise<boolean> {
    if (!process.env.AKISMET_API_KEY) {
      return false;
    }
  
    try {
      const params = new URLSearchParams({
        blog: process.env.NEXTAUTH_URL || 'https://waveorder.app',
        user_ip: data.user_ip,
        user_agent: data.user_agent,
        comment_type: data.type,
        comment_author: data.author,
        comment_author_email: data.author_email,
        comment_content: data.content,
      });
  
      const response = await fetch(
        `https://${process.env.AKISMET_API_KEY}.rest.akismet.com/1.1/submit-ham`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'WaveOrder/1.0 | Akismet/Node.js'
          },
          body: params.toString(),
        }
      );
  
      return response.ok;
    } catch (error) {
      console.error('Failed to submit ham to Akismet:', error);
      return false;
    }
  }
  
  // Verify API key (useful for setup/testing)
  export async function verifyAkismetKey(): Promise<boolean> {
    if (!process.env.AKISMET_API_KEY) {
      return false;
    }
  
    try {
      const params = new URLSearchParams({
        key: process.env.AKISMET_API_KEY,
        blog: process.env.NEXTAUTH_URL || 'https://waveorder.app',
      });
  
      const response = await fetch(
        'https://rest.akismet.com/1.1/verify-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );
  
      const result = await response.text();
      return result === 'valid';
    } catch (error) {
      console.error('Failed to verify Akismet key:', error);
      return false;
    }
  }