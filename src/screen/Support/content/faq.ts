import type { FaqSection } from './types';

// Answers describe what the app does today. Payments: only Cash on Delivery can be
// chosen at checkout, so nothing here promises card payments.
export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Getting started',
    items: [
      {
        id: 'how-it-works',
        question: 'How does HomeMade Creator work?',
        answer: [
          'You can buy a finished piece or design your own in a few steps:',
          {
            ordered: true,
            list: [
              'Browse the categories.',
              'Look through the products in a category.',
              'Tap "Create your own design".',
              'Choose a base product (for example a hoodie or a gift bag) when the category needs one.',
              'Personalise it in the Creative Studio.',
              'Preview your creation.',
              'Place your order.',
            ],
          },
        ],
      },
      {
        id: 'creative-studio',
        question: 'What is the Creative Studio?',
        answer: [
          'The Creative Studio is where you design your own piece using the materials available for that product. Depending on the product, you can:',
          {
            list: [
              'add components such as beads, flowers or designs',
              'drag them into place',
              'resize and rotate them',
              'move them forward or backward',
              'duplicate or remove them',
              'add personalised text',
              'preview the finished design',
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Designing',
    items: [
      {
        id: 'jewelry',
        question: 'Can I create my own bracelet or necklace?',
        answer: [
          'Yes. Bracelets and necklaces open the Jewelry Studio, where you build your piece from the beads and components that are available.',
        ],
      },
      {
        id: 'bouquet',
        question: 'Can I create my own flower bouquet?',
        answer: [
          'Yes. Choose a bouquet base, then arrange it your way using the available:',
          { list: ['flowers', 'greenery', 'fillers', 'decorations and wrapping'] },
          'You decide how the arrangement looks.',
        ],
      },
      {
        id: 'gift',
        question: 'Can I create my own gift?',
        answer: [
          'Yes. Choose a gift base such as a bag, box or basket when one is available, then fill and decorate it with the available products and decorations. You can also add personalised text.',
        ],
      },
      {
        id: 'apparel',
        question: 'Can I customise clothing?',
        answer: [
          'When customisable clothing is available, choose the piece and your size, then personalise it with the designs, logos or other options offered for it.',
        ],
      },
    ],
  },
  {
    title: 'Products & designs',
    items: [
      {
        id: 'product-vs-design',
        question: 'What is the difference between a product and my design?',
        answer: [
          'Products are finished pieces made and offered by HomeMade Creator.',
          'Your designs are personalised pieces you create yourself in the Creative Studio. You can find them under My Designs.',
        ],
      },
      {
        id: 'edit-design',
        question: 'Can I edit my design?',
        answer: [
          'Yes, you can open a saved design from My Designs and keep working on it.',
          'Once an order for a design has been placed, that ordered design becomes read-only.',
        ],
      },
      {
        id: 'unavailable',
        question: 'Why is a component unavailable?',
        answer: [
          'A component can be unavailable because:',
          {
            list: [
              'it is out of stock',
              'it is not currently offered',
              'it is not available for the product you chose',
            ],
          },
        ],
      },
      {
        id: 'stock',
        question: 'Why can’t I add more of an item?',
        answer: [
          'Some materials and products are available in limited quantities. The studio only lets you use what is in stock, so your order can be made exactly as designed.',
        ],
      },
    ],
  },
  {
    title: 'Pricing',
    items: [
      {
        id: 'price',
        question: 'How is the price of my custom product calculated?',
        answer: [
          'The price is based on the base product you chose and the components you use in your design. The total updates as you design, so you always see the price before you order.',
        ],
      },
    ],
  },
  {
    title: 'Orders & payments',
    items: [
      {
        id: 'place-order',
        question: 'How do I place an order?',
        answer: [
          {
            ordered: true,
            list: [
              'Create a design or choose a product.',
              'Preview it.',
              'Continue to order.',
              'Enter or confirm your delivery details.',
              'Choose how to pay.',
              'Place your order.',
            ],
          },
        ],
      },
      {
        id: 'change-after-order',
        question: 'Can I change a design after ordering?',
        answer: [
          'No. Once your order is placed, the ordered design is locked so that the piece you receive matches exactly what you ordered.',
        ],
      },
      {
        id: 'statuses',
        question: 'What do the order statuses mean?',
        answer: [
          {
            list: [
              'Ordered: we have received your order.',
              'Being made: your personalised piece is being created.',
              'Created: your piece is finished.',
              'Ready for courier: your order is ready for delivery.',
              'With courier: the courier has collected your order.',
              'Completed: your order is complete.',
            ],
          },
          'You can follow every step under My Orders.',
        ],
      },
      {
        id: 'payment-methods',
        question: 'What payment methods are available?',
        answer: [
          'At the moment you pay with Cash on Delivery: you pay when your order arrives.',
          'If more payment methods become available, you will see them at checkout.',
        ],
      },
    ],
  },
];
