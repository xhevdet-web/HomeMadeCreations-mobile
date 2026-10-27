import type { AppLanguage } from '@/i18n';
import { SUPPORT_EMAIL } from './contact';
import type { LegalDocument } from './types';

// General wording only. `pending` blocks mark business policy that the owner still has to
// confirm (company details, jurisdiction, delivery times, refunds); never fill them in
// with invented terms.
const TERMS_EN: LegalDocument = {
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

// Albanian Terms: the same sections, meaning and open points as the English text.
const TERMS_SQ: LegalDocument = {
  title: 'Kushtet e shërbimit',
  lastUpdated: '2026-10-25',
  intro:
    'Këto kushte shpjegojnë si mund ta përdorësh HomeMade Creator dhe çfarë të presësh kur dizajnon dhe porosit te ne. Të lutem lexoji para se të bësh një porosi.',
  sections: [
    {
      title: 'Rreth HomeMade Creator',
      body: [
        'HomeMade Creator është një aplikacion për të shfletuar produkte të punuara me dorë dhe për të dizajnuar punimet e tua personale, si stoli, buqeta, dhurata dhe veshje, të cilat më pas i punojmë për ty.',
        { pending: 'Emri ligjor, adresa e regjistruar dhe të dhënat e regjistrimit të biznesit ende duhet të shtohen.' },
      ],
    },
    {
      title: 'Përdorimi i shërbimit',
      body: [
        'Duke krijuar një llogari ose duke bërë një porosi, pajtohesh me këto kushte. Nëse nuk pajtohesh, të lutem mos e përdor aplikacionin.',
        'Pajtohesh ta përdorësh aplikacionin vetëm për qëllime të ligjshme dhe të japësh informacione të sakta.',
      ],
    },
    {
      title: 'Llogaritë',
      body: [
        'Të duhet një llogari për të dizajnuar dhe porositur. Mbaji të dhënat e kyçjes private: je përgjegjës për aktivitetin në llogarinë tënde.',
        'Të lutem mbaji të përditësuar emrin, numrin e telefonit dhe adresën e dërgesës që të mund t’i dërgojmë porositë.',
      ],
    },
    {
      title: 'Produktet dhe dizajnet personale',
      body: [
        'Mund të porosisësh produkte të punuara nga HomeMade Creator, ose të krijosh dizajnin tënd në Studion Krijuese me materialet në dispozicion për secilin produkt.',
        'Pamjet tregojnë si është rregulluar dizajni yt. Meqë çdo punim bëhet me dorë, produkti i përfunduar mund të ndryshojë pak në ngjyrë, madhësi ose vendosje nga ajo që sheh në ekran.',
      ],
    },
    {
      title: 'Dizajnet dhe përmbajtja që dërgon',
      body: [
        'Nëse ngarkon fotografitë e tua ose shton tekst, konfirmon se janë të tuat ose ke leje t’i përdorësh, dhe se nuk shkelin asnjë ligj ose të drejtat e dikujt tjetër.',
        'Të drejtat mbi përmbajtjen tënde mbeten të tuat. Na lejon ta përdorim për të punuar, shfaqur dhe dërguar porosinë tënde, dhe për të shfaqur dizajnet e përfunduara në aplikacion siç përshkruhet në Politikën e privatësisë.',
        'Mund ta refuzojmë ose anulojmë një porosi që përmban përmbajtje që e konsiderojmë të paligjshme, fyese ose shkelëse të të drejtave.',
      ],
    },
    {
      title: 'Çmimet',
      body: [
        'Çmimet shfaqen në aplikacion. Çmimi i një dizajni personal bazohet në produktin bazë dhe në elementet që zgjedh, dhe shfaqet para se të porosisësh.',
        'Çmimi që sheh kur bën porosinë është çmimi që paguan për atë porosi.',
      ],
    },
    {
      title: 'Porositë',
      body: [
        'Porosia jote bëhet kur e konfirmon në fund të porosisë. Mund ta ndjekësh ecurinë te Porositë e mia.',
        'Pasi bëhet porosia, dizajni i porositur kyçet që punimi që bëjmë të përputhet me atë që porosite.',
      ],
    },
    {
      title: 'Pagesat',
      body: [
        'Mënyrat e pagesës në dispozicion shfaqen gjatë porosisë. Aktualisht paguan me para në dorëzim, kur të arrijë porosia.',
      ],
    },
    {
      title: 'Disponueshmëria e produkteve',
      body: [
        'Materialet dhe produktet janë në sasi të kufizuar. Stoku rezervohet vetëm kur bëhet porosia, ndaj një artikull në një dizajn të ruajtur mund të mos jetë më në dispozicion para se ta porosisësh.',
      ],
    },
    {
      title: 'Produktet personale',
      body: [
        'Punimet personale bëhen sipas dizajnit tënd dhe zakonisht nuk mund të rishiten. Kjo mund të ndikojë nëse mund të ndryshohen, anulohen ose kthehen.',
      ],
    },
    {
      title: 'Pronësia intelektuale',
      body: [
        'Aplikacioni, përmbajtja e tij, fotografitë e produkteve, dizajnet e ofruara në katalog dhe emri HomeMade Creator i përkasin HomeMade Creator ose licencuesve të tij. Nuk mund t’i kopjosh ose ripërdorësh pa leje.',
      ],
    },
    {
      title: 'Përdorimi i ndaluar',
      body: [
        'Nuk lejohet:',
        {
          list: [
            'ta përdorësh aplikacionin për diçka të paligjshme ose mashtruese',
            'të ngarkosh përmbajtje fyese ose që shkel të drejtat e dikujt tjetër',
            'të përpiqesh të hysh në llogaritë ose të dhënat e të tjerëve',
            'të ndërhysh, ta mbingarkosh ose të përpiqesh ta prishësh aplikacionin ose sistemet e tij',
          ],
        },
      ],
    },
    {
      title: 'Ndryshimet dhe anulimet e porosive',
      body: [
        'Nëse duhet ta ndryshosh ose anulosh një porosi, na kontakto sa më shpejt. Pasi të ketë filluar puna për një punim personal, mund të mos jetë e mundur ta ndryshojmë ose anulojmë.',
        { pending: 'Politika e anulimit (deri kur dhe si mund të anulohet një porosi) ende duhet të konfirmohet.' },
      ],
    },
    {
      title: 'Dërgesa',
      body: [
        'Dërgojmë në adresën që ke në llogari. Të lutem sigurohu që është e saktë para se të porosisësh.',
        { pending: 'Zonat e dërgesës, kohët e dërgesës dhe çdo tarifë dërgese ende duhet të konfirmohen.' },
      ],
    },
    {
      title: 'Kthimet dhe rimbursimet',
      body: [
        'Nëse porosia arrin e dëmtuar ose nuk është ajo që porosite, na kontakto dhe do të të ndihmojmë.',
        { pending: 'Politika e kthimeve dhe rimbursimeve, përfshirë afatet dhe përjashtimet për produktet personale, ende duhet të konfirmohet.' },
      ],
    },
    {
      title: 'Kufizimi i përgjegjësisë',
      body: [
        'Kujdesemi që çdo porosi të punohet dhe të dërgohet mirë. Për aq sa e lejon ligji, nuk jemi përgjegjës për humbje të tërthorta, ose për vonesa apo probleme të shkaktuara nga ngjarje jashtë kontrollit tonë të arsyeshëm. Asgjë në këto kushte nuk i kufizon të drejtat që ke sipas ligjit dhe që nuk mund të kufizohen.',
        { pending: 'Ligji i zbatueshëm dhe juridiksioni për këto kushte ende duhet të konfirmohen.' },
      ],
    },
    {
      title: 'Ndryshimet e këtyre kushteve',
      body: [
        'Herë pas here mund t’i përditësojmë këto kushte. Data në krye tregon kur janë ndryshuar për herë të fundit. Nëse vazhdon ta përdorësh aplikacionin pas një ndryshimi, i pranon kushtet e përditësuara.',
      ],
    },
    {
      title: 'Kontakti',
      body: [`Ke pyetje për këto kushte? Na shkruaj në ${SUPPORT_EMAIL}.`],
    },
  ],
};

/** The Terms of Service in each app language. */
export const TERMS: Record<AppLanguage, LegalDocument> = { en: TERMS_EN, sq: TERMS_SQ };
