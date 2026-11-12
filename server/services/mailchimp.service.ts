import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';

/** Mailchimp identifies a member by the MD5 hash of their lower-cased email. */
export function subscriberHash(email: string): string {
  return createHash('md5').update(email.trim().toLowerCase()).digest('hex');
}

/**
 * Service for interacting with Mailchimp email marketing API
 */
export class MailchimpService {
  private client: typeof mailchimp;
  private initialized: boolean = false;
  private listId: string = '';

  constructor(apiKey?: string, serverPrefix?: string, listId?: string) {
    this.client = mailchimp;
    
    if (apiKey && serverPrefix && listId) {
      this.initialize(apiKey, serverPrefix, listId);
    } else {
      console.log('Mailchimp service created but not initialized (missing credentials)');
    }
  }

  /**
   * Initialize the Mailchimp client with API credentials
   */
  public initialize(apiKey: string, serverPrefix: string, listId: string): void {
    try {
      this.client.setConfig({
        apiKey: apiKey,
        server: serverPrefix // e.g., "us1", "us2", etc.
      });
      
      this.listId = listId;
      this.initialized = true;
      console.log('Mailchimp service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mailchimp client:', error);
      this.initialized = false;
    }
  }

  /**
   * Add a new member to a Mailchimp audience list
   * @param email User's email address
   * @param firstName User's first name (optional)
   * @param lastName User's last name (optional)
   * @returns Success status and any response data
   */
  public async addMember(email: string, firstName?: string, lastName?: string): Promise<any> {
    if (!this.initialized) {
      console.warn('Mailchimp service not initialized. Skipping addMember operation.');
      return { 
        success: false, 
        error: 'Service not initialized'
      };
    }
    
    try {
      // Construct member data
      const memberData: any = {
        email_address: email,
        status: 'subscribed', // or 'pending' if you want double opt-in
        merge_fields: {}
      };
      
      // Add names if provided
      if (firstName) {
        memberData.merge_fields.FNAME = firstName;
      }
      
      if (lastName) {
        memberData.merge_fields.LNAME = lastName;
      }
      
      // Add to list
      const response = await this.client.lists.addListMember(this.listId, memberData);
      
      console.log(`Added ${email} to Mailchimp list`);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      // Handle potential errors
      console.error('Error adding member to Mailchimp:', error);
      
      // If already subscribed, don't treat as error
      if (error.response && error.response.text && error.response.text.includes('Member Exists')) {
        return {
          success: true,
          existed: true,
          message: 'Email already subscribed'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Adds (active = true) or removes (active = false) one tag on an existing
   * audience member. Never creates a member: people who aren't on the list,
   * or who were deleted from it, come back as notOnList.
   */
  public async setMemberTag(
    email: string,
    tagName: string,
    active: boolean,
  ): Promise<{ success: boolean; notOnList?: boolean; error?: string }> {
    if (!this.initialized) {
      return { success: false, error: 'Service not initialized' };
    }
    try {
      await this.client.lists.updateListMemberTags(this.listId, subscriberHash(email), {
        tags: [{ name: tagName, status: active ? 'active' : 'inactive' }],
      });
      return { success: true };
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      if (status === 404) return { success: false, notOnList: true };
      return { success: false, error: error?.message || 'Unknown error occurred' };
    }
  }

  /**
   * Check if the service is properly initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Create instance with env variables if available
export const mailchimpService = new MailchimpService(
  process.env.MAILCHIMP_API_KEY,
  process.env.MAILCHIMP_SERVER_PREFIX,
  process.env.MAILCHIMP_LIST_ID
);