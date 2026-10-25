import { SUPPORT_EMAIL } from './contact';
import type { LegalDocument } from './types';

// Describes only what the app does today: no analytics, advertising IDs, location,
// contacts or tracking. Photos are only the images a customer picks to upload. Update
// this when the app starts collecting anything new.
export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: '2026-10-25',
  intro:
    'Your privacy matters to us. This policy explains what information HomeMade Creator uses, why, and the choices you have.',
  sections: [
    {
      title: 'Information we collect',
      body: [
        'We only collect what we need to run your account, make your designs and deliver your orders:',
        {
          list: [
            'Account information: first name, last name, username, email address and phone number.',
            'Delivery information: country, address and postal code.',
            'Design information: the designs you create, the components and options you choose, any text you add, images you upload and the design previews the app creates.',
            'Order information: the products you order, order details, delivery information, payment type and status, and order status.',
          ],
        },
        'We do not use analytics or advertising tools, and the app does not collect your location, contacts or advertising identifiers.',
      ],
    },
    {
      title: 'How we use information',
      body: [
        {
          list: [
            'to create and manage your account and sign you in',
            'to save your designs so you can come back to them',
            'to make, prepare and deliver your orders',
            'to show you the status of your orders',
            'to answer your questions when you contact us',
          ],
        },
      ],
    },
    {
      title: 'Account information',
      body: [
        'Your account details are used to identify you and to fill in your delivery details at checkout. You can view and update your name, phone number and address in your profile.',
        'To keep you signed in, the app stores a sign-in token in your device’s secure storage. Signing out removes it.',
      ],
    },
    {
      title: 'Custom designs',
      body: [
        'Designs you create are saved to your account so you can view, edit and order them.',
        'When an order for one of your designs is completed, the design may be shown to other customers in the app as inspiration, together with your first and last name.',
        { pending: 'Confirm whether completed designs should continue to be shown to other customers, and whether customers can opt out.' },
      ],
    },
    {
      title: 'Orders and delivery',
      body: [
        'When you place an order, we keep a copy of the ordered design and your delivery details with the order, so we can make it exactly as ordered and deliver it. Our team uses this information to prepare and deliver your order.',
      ],
    },
    {
      title: 'Payments',
      body: [
        'Currently orders are paid with Cash on Delivery, so the app does not collect or store card details. We record the payment type and whether the order has been paid.',
      ],
    },
    {
      title: 'Images and file storage',
      body: [
        'The app only accesses the photos you choose to upload, for example your own artwork for a clothing design. Uploaded images and design previews are stored with our storage provider so they can be shown in the app and used to make your order.',
        'Drafts of designs you are still working on are also kept on your device so you do not lose them.',
      ],
    },
    {
      title: 'Data security',
      body: [
        'We use reasonable technical and organisational measures to protect your information, such as password-protected accounts, secure storage of your sign-in on your device, and access limited to the people who need it. No method of storing or sending information is completely secure, but we work to protect it.',
      ],
    },
    {
      title: 'Data retention',
      body: [
        'We keep your account information while your account exists, and order records for as long as needed to fulfil orders and meet our legal obligations.',
        { pending: 'The exact retention periods for account and order data still need to be confirmed.' },
      ],
    },
    {
      title: 'Your choices and rights',
      body: [
        'You can view and update your personal details in your profile at any time. You can also email us to ask for a copy of your information, or to have it corrected or deleted. We will respond within a reasonable time, subject to any information we must keep, for example for orders.',
        { pending: 'The rights that apply depend on where the business operates; the applicable data-protection law still needs to be confirmed.' },
      ],
    },
    {
      title: 'Children’s privacy',
      body: [
        'HomeMade Creator is not intended for children, and we do not knowingly collect information from children. If you believe a child has given us information, please contact us and we will remove it.',
        { pending: 'The minimum age for using the app still needs to be confirmed.' },
      ],
    },
    {
      title: 'Changes to this policy',
      body: [
        'We may update this policy when the app changes. The date at the top shows when it was last updated.',
      ],
    },
    {
      title: 'Contact us',
      body: [`Questions about your privacy? Email us at ${SUPPORT_EMAIL}.`],
    },
  ],
};
