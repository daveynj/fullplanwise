declare module '@mailchimp/mailchimp_marketing' {
  interface MailchimpConfig {
    apiKey: string;
    server: string;
  }

  interface MailchimpMergeFields {
    [key: string]: any;
  }

  interface MailchimpMemberData {
    email_address: string;
    status: 'subscribed' | 'pending' | 'unsubscribed' | 'cleaned';
    merge_fields?: MailchimpMergeFields;
    tags?: string[];
    [key: string]: any;
  }

  interface MailchimpResponse {
    id: string;
    email_address: string;
    status: string;
    [key: string]: any;
  }

  interface MailchimpLists {
    addListMember(listId: string, data: MailchimpMemberData): Promise<MailchimpResponse>;
    updateListMember(listId: string, subscriberHash: string, data: MailchimpMemberData): Promise<MailchimpResponse>;
    getListMember(listId: string, subscriberHash: string): Promise<MailchimpResponse>;
    getAllLists(params?: any): Promise<{ lists: any[] }>;
  }

  interface Mailchimp {
    setConfig(config: MailchimpConfig): void;
    lists: MailchimpLists;
  }

  const mailchimp: Mailchimp;
  export = mailchimp;
}