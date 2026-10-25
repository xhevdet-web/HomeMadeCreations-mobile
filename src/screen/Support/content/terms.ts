import { SUPPORT_EMAIL } from './contact';
import type { LegalDocument } from './types';

// General wording only. `pending` blocks mark business policy that the owner still has to
// confirm (company details, jurisdiction, delivery times, refunds); never fill them in
// with invented terms.
export const TERMS: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: '2026-10-25',
  intro:
    'These terms explain how you can use HomeMade Creator and what you can expect when you design and order with us. Please read them before you place an order.',
  sections: [
    {
      title: 'About HomeMade Creator',
      body: [
        'HomeMade Creator is an app for browsing handmade products and designing your own personalised pieces, such as jewelry, bouquets, gifts and clothing, which we then make for you.',
        { pending: 'The legal name, registered address and registration details of the business still need to be added.' },
      ],
    },
    {
      title: 'Using the service',
      body: [
        'By creating an account or placing an order, you agree to these terms. If you do not agree, please do not use the app.',
        'You agree to use the app only for lawful purposes and to give accurate information.',
      ],
    },
    {
      title: 'Accounts',
      body: [
        'You need an account to design and order. Keep your login details private: you are responsible for activity on your account.',
        'Please keep your name, phone number and delivery address up to date so we can deliver your orders.',
      ],
    },
    {
      title: 'Products and custom designs',
      body: [
        'You can order products made by HomeMade Creator, or create your own design in the Creative Studio using the materials available for each product.',
        'Previews show how your design is arranged. Because every piece is handmade, the finished product may differ slightly in colour, size or placement from what you see on screen.',
      ],
    },
    {
      title: 'Designs and content you submit',
      body: [
        'If you upload your own images or add text, you confirm that you own them or have permission to use them, and that they do not break any law or anyone else’s rights.',
        'You keep the rights to your own content. You allow us to use it to make, show and deliver your order, and to show completed designs in the app as described in our Privacy Policy.',
        'We may refuse or cancel an order that contains content we consider unlawful, offensive or infringing.',
      ],
    },
    {
      title: 'Pricing',
      body: [
        'Prices are shown in the app. The price of a custom design is based on the base product and the components you choose, and is shown before you order.',
        'The price you see when you place your order is the price you pay for that order.',
      ],
    },
    {
      title: 'Orders',
      body: [
        'Your order is placed when you confirm it at checkout. You can follow its progress under My Orders.',
        'Once an order is placed, the ordered design is locked so the piece we make matches what you ordered.',
      ],
    },
    {
      title: 'Payments',
      body: [
        'The payment methods available are shown at checkout. Currently you pay with Cash on Delivery, when your order arrives.',
      ],
    },
    {
      title: 'Product availability',
      body: [
        'Materials and products are available in limited quantities. Stock is only reserved when your order is placed, so an item in a saved design may become unavailable before you order it.',
      ],
    },
    {
      title: 'Custom and personalised products',
      body: [
        'Personalised pieces are made to your design and cannot usually be resold. This can affect whether they can be changed, cancelled or returned.',
      ],
    },
    {
      title: 'Intellectual property',
      body: [
        'The app, its content, product photos, designs offered in the catalog and the HomeMade Creator name belong to HomeMade Creator or its licensors. You may not copy or reuse them without permission.',
      ],
    },
    {
      title: 'Prohibited use',
      body: [
        'You must not:',
        {
          list: [
            'use the app for anything unlawful or fraudulent',
            'upload content that is offensive or infringes someone else’s rights',
            'try to access other people’s accounts or data',
            'interfere with, overload or try to break the app or its systems',
          ],
        },
      ],
    },
    {
      title: 'Order changes and cancellations',
      body: [
        'If you need to change or cancel an order, contact us as soon as possible. Once work on a personalised piece has started, it may not be possible to change or cancel it.',
        { pending: 'The cancellation policy (until when and how an order can be cancelled) still needs to be confirmed.' },
      ],
    },
    {
      title: 'Delivery',
      body: [
        'We deliver to the address in your account. Please make sure it is correct before you order.',
        { pending: 'Delivery areas, delivery times and any delivery fees still need to be confirmed.' },
      ],
    },
    {
      title: 'Returns and refunds',
      body: [
        'If your order arrives damaged or is not what you ordered, contact us and we will help.',
        { pending: 'The returns and refunds policy, including any time limits and exceptions for personalised products, still needs to be confirmed.' },
      ],
    },
    {
      title: 'Limitation of liability',
      body: [
        'We take care to make and deliver every order well. To the extent allowed by law, we are not responsible for indirect losses, or for delays or problems caused by events outside our reasonable control. Nothing in these terms limits rights you have under the law that cannot be limited.',
        { pending: 'The governing law and jurisdiction for these terms still need to be confirmed.' },
      ],
    },
    {
      title: 'Changes to these terms',
      body: [
        'We may update these terms from time to time. The date at the top shows when they were last changed. Continuing to use the app after a change means you accept the updated terms.',
      ],
    },
    {
      title: 'Contact',
      body: [`Questions about these terms? Email us at ${SUPPORT_EMAIL}.`],
    },
  ],
};
