import type { AppLanguage } from '@/i18n';
import type { FaqSection } from './types';

// Answers describe what the app does today. Payments: only Cash on Delivery can be
// chosen at checkout, so nothing here promises card payments.
const FAQ_EN: FaqSection[] = [
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

// Albanian FAQ: same sections, question ids and order as the English one.
const FAQ_SQ: FaqSection[] = [
  {
    title: 'Si të fillosh',
    items: [
      {
        id: 'how-it-works',
        question: 'Si funksionon HomeMade Creator?',
        answer: [
          'Mund të blesh një punim të gatshëm ose ta dizajnosh vetë në disa hapa:',
          {
            ordered: true,
            list: [
              'Shfleto kategoritë.',
              'Shiko produktet në një kategori.',
              'Prek "Krijo dizajnin tënd".',
              'Zgjidh një produkt bazë (për shembull një duks ose një qese dhuratash) kur kategoria e kërkon.',
              'Personalizoje në Studion Krijuese.',
              'Shiko pamjen e krijimit tënd.',
              'Bëj porosinë.',
            ],
          },
        ],
      },
      {
        id: 'creative-studio',
        question: 'Çfarë është Studio Krijuese?',
        answer: [
          'Studio Krijuese është vendi ku dizajnon punimin tënd me materialet në dispozicion për atë produkt. Varësisht nga produkti, mund të:',
          {
            list: [
              'shtosh elemente si rruaza, lule ose dizajne',
              'i tërheqësh në vendin e duhur',
              'u ndryshosh madhësinë dhe t’i rrotullosh',
              'i sjellësh përpara ose t’i dërgosh prapa',
              'i dyfishosh ose t’i heqësh',
              'shtosh tekst personal',
              'shohësh pamjen e dizajnit të përfunduar',
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Dizajnimi',
    items: [
      {
        id: 'jewelry',
        question: 'A mund ta krijoj vetë byzylykun ose gjerdanin tim?',
        answer: [
          'Po. Byzylykët dhe gjerdanët hapin Studion e Stolive, ku e ndërton punimin me rruazat dhe elementet në dispozicion.',
        ],
      },
      {
        id: 'bouquet',
        question: 'A mund ta krijoj vetë buqetën time me lule?',
        answer: [
          'Po. Zgjidh një bazë për buqetën, pastaj rregulloje sipas dëshirës me:',
          { list: ['lule', 'gjelbërim', 'mbushës', 'dekorime dhe mbështjellje'] },
          'Ti vendos si duket rregullimi.',
        ],
      },
      {
        id: 'gift',
        question: 'A mund ta krijoj vetë dhuratën time?',
        answer: [
          'Po. Zgjidh një bazë dhurate si qese, kuti ose shportë kur ka në dispozicion, pastaj mbushe dhe dekoroje me produktet dhe dekorimet në dispozicion. Mund të shtosh edhe tekst personal.',
        ],
      },
      {
        id: 'apparel',
        question: 'A mund të personalizoj veshje?',
        answer: [
          'Kur ka veshje për personalizim, zgjidh veshjen dhe madhësinë, pastaj personalizoje me dizajnet, logot ose opsionet e tjera që ofrohen për të.',
        ],
      },
    ],
  },
  {
    title: 'Produktet dhe dizajnet',
    items: [
      {
        id: 'product-vs-design',
        question: 'Cili është dallimi mes një produkti dhe dizajnit tim?',
        answer: [
          'Produktet janë punime të gatshme, të punuara dhe të ofruara nga HomeMade Creator.',
          'Dizajnet e tua janë punime personale që i krijon vetë në Studion Krijuese. I gjen te Dizajnet e mia.',
        ],
      },
      {
        id: 'edit-design',
        question: 'A mund ta ndryshoj dizajnin tim?',
        answer: [
          'Po, mund ta hapësh një dizajn të ruajtur nga Dizajnet e mia dhe të vazhdosh punën.',
          'Pasi të bëhet porosia për një dizajn, ai dizajn i porositur mund vetëm të shikohet.',
        ],
      },
      {
        id: 'unavailable',
        question: 'Pse një element nuk është në dispozicion?',
        answer: [
          'Një element mund të mos jetë në dispozicion sepse:',
          {
            list: [
              'ka mbaruar nga stoku',
              'aktualisht nuk ofrohet',
              'nuk është në dispozicion për produktin që zgjodhe',
            ],
          },
        ],
      },
      {
        id: 'stock',
        question: 'Pse nuk mund të shtoj më shumë nga një artikull?',
        answer: [
          'Disa materiale dhe produkte janë në sasi të kufizuar. Studio të lejon të përdorësh vetëm atë që është në stok, që porosia të punohet saktësisht siç e dizajnove.',
        ],
      },
    ],
  },
  {
    title: 'Çmimet',
    items: [
      {
        id: 'price',
        question: 'Si llogaritet çmimi i produktit tim personal?',
        answer: [
          'Çmimi bazohet në produktin bazë që zgjodhe dhe në elementet që përdor në dizajn. Totali përditësohet ndërsa dizajnon, kështu e sheh gjithmonë çmimin para se të porosisësh.',
        ],
      },
    ],
  },
  {
    title: 'Porositë dhe pagesat',
    items: [
      {
        id: 'place-order',
        question: 'Si bëj një porosi?',
        answer: [
          {
            ordered: true,
            list: [
              'Krijo një dizajn ose zgjidh një produkt.',
              'Shiko pamjen e tij.',
              'Vazhdo te porosia.',
              'Shkruaj ose konfirmo të dhënat e dërgesës.',
              'Zgjidh mënyrën e pagesës.',
              'Bëj porosinë.',
            ],
          },
        ],
      },
      {
        id: 'change-after-order',
        question: 'A mund ta ndryshoj dizajnin pasi ta kem porositur?',
        answer: [
          'Jo. Pasi bëhet porosia, dizajni i porositur kyçet që punimi që merr të jetë saktësisht ai që porosite.',
        ],
      },
      {
        id: 'statuses',
        question: 'Çfarë kuptimi kanë statuset e porosisë?',
        answer: [
          {
            list: [
              'Porositur: e kemi marrë porosinë tënde.',
              'Në përgatitje: punimi yt personal po punohet.',
              'E punuar: punimi yt është gati.',
              'Gati për korrier: porosia jote është gati për dërgesë.',
              'Te korrieri: korrieri e ka marrë porosinë tënde.',
              'Përfunduar: porosia jote ka përfunduar.',
            ],
          },
          'Mund ta ndjekësh çdo hap te Porositë e mia.',
        ],
      },
      {
        id: 'payment-methods',
        question: 'Cilat mënyra pagese janë në dispozicion?',
        answer: [
          'Aktualisht paguan me para në dorëzim: paguan kur të arrijë porosia.',
          'Nëse shtohen mënyra të tjera pagese, do t’i shohësh gjatë porosisë.',
        ],
      },
    ],
  },
];

/** The FAQ in each app language. */
export const FAQ_SECTIONS: Record<AppLanguage, FaqSection[]> = { en: FAQ_EN, sq: FAQ_SQ };
