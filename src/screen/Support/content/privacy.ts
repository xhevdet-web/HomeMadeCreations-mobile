import type { AppLanguage } from '@/i18n';
import { SUPPORT_EMAIL } from './contact';
import type { LegalDocument } from './types';

// Describes only what the app does today: no analytics, advertising IDs, location,
// contacts or tracking. Photos are only the images a customer picks to upload. Update
// this when the app starts collecting anything new.
const PRIVACY_EN: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: '2026-10-27',
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
        'Drafts of designs you are still working on, and app preferences such as theme and language, are also kept on your device so you do not lose them.',
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

// Albanian Privacy Policy: the same sections, meaning and open points as the English text.
const PRIVACY_SQ: LegalDocument = {
  title: 'Politika e privatësisë',
  lastUpdated: '2026-10-27',
  intro:
    'Privatësia jote është e rëndësishme për ne. Kjo politikë shpjegon cilat informacione përdor HomeMade Creator, pse i përdor dhe çfarë zgjedhjesh ke.',
  sections: [
    {
      title: 'Informacionet që mbledhim',
      body: [
        'Mbledhim vetëm atë që na duhet për të mbajtur llogarinë tënde, për të punuar dizajnet dhe për të dërguar porositë:',
        {
          list: [
            'Të dhënat e llogarisë: emri, mbiemri, emri i përdoruesit, adresa e email-it dhe numri i telefonit.',
            'Të dhënat e dërgesës: shteti, adresa dhe kodi postar.',
            'Të dhënat e dizajnit: dizajnet që krijon, elementet dhe opsionet që zgjedh, teksti që shton, fotografitë që ngarkon dhe pamjet e dizajnit që krijon aplikacioni.',
            'Të dhënat e porosisë: produktet që porosit, detajet e porosisë, të dhënat e dërgesës, mënyra dhe statusi i pagesës, dhe statusi i porosisë.',
          ],
        },
        'Nuk përdorim mjete analitike ose reklamuese, dhe aplikacioni nuk mbledh vendndodhjen, kontaktet ose identifikuesit reklamues.',
      ],
    },
    {
      title: 'Si i përdorim informacionet',
      body: [
        {
          list: [
            'për të krijuar dhe menaxhuar llogarinë tënde dhe për të të kyçur',
            'për të ruajtur dizajnet që t’u kthehesh kur të duash',
            'për të punuar, përgatitur dhe dërguar porositë',
            'për të të treguar statusin e porosive',
            'për t’iu përgjigjur pyetjeve kur na kontakton',
          ],
        },
      ],
    },
    {
      title: 'Të dhënat e llogarisë',
      body: [
        'Të dhënat e llogarisë përdoren për të të identifikuar dhe për të plotësuar të dhënat e dërgesës gjatë porosisë. Mund ta shohësh dhe përditësosh emrin, numrin e telefonit dhe adresën në profilin tënd.',
        'Që të mbetesh i kyçur, aplikacioni ruan një çelës kyçjeje në hapësirën e sigurt të pajisjes. Kur çkyçesh, ai fshihet.',
      ],
    },
    {
      title: 'Dizajnet personale',
      body: [
        'Dizajnet që krijon ruhen në llogarinë tënde që t’i shohësh, ndryshosh dhe porosisësh.',
        'Kur përfundon një porosi për njërin nga dizajnet e tua, dizajni mund t’u shfaqet klientëve të tjerë në aplikacion si frymëzim, së bashku me emrin dhe mbiemrin tënd.',
        { pending: 'Duhet konfirmuar nëse dizajnet e përfunduara do të vazhdojnë t’u shfaqen klientëve të tjerë dhe nëse klientët mund të zgjedhin të mos shfaqen.' },
      ],
    },
    {
      title: 'Porositë dhe dërgesa',
      body: [
        'Kur bën një porosi, ruajmë një kopje të dizajnit të porositur dhe të dhënat e dërgesës bashkë me porosinë, që ta punojmë saktësisht siç u porosit dhe ta dërgojmë. Ekipi ynë i përdor këto informacione për të përgatitur dhe dërguar porosinë.',
      ],
    },
    {
      title: 'Pagesat',
      body: [
        'Aktualisht porositë paguhen me para në dorëzim, ndaj aplikacioni nuk mbledh dhe nuk ruan të dhëna të kartave. Regjistrojmë mënyrën e pagesës dhe nëse porosia është paguar.',
      ],
    },
    {
      title: 'Fotografitë dhe ruajtja e skedarëve',
      body: [
        'Aplikacioni ka qasje vetëm te fotografitë që zgjedh t’i ngarkosh, për shembull arti yt për një dizajn veshjeje. Fotografitë e ngarkuara dhe pamjet e dizajneve ruhen te ofruesi ynë i hapësirës që të shfaqen në aplikacion dhe të përdoren për të punuar porosinë.',
        'Skicat e dizajneve në të cilat ende po punon, si dhe parapëlqimet e aplikacionit si tema dhe gjuha, ruhen edhe në pajisjen tënde që të mos humbin.',
      ],
    },
    {
      title: 'Siguria e të dhënave',
      body: [
        'Përdorim masa teknike dhe organizative të arsyeshme për të mbrojtur informacionet e tua, si llogari të mbrojtura me fjalëkalim, ruajtje të sigurt të kyçjes në pajisje dhe qasje të kufizuar vetëm për personat që kanë nevojë. Asnjë mënyrë ruajtjeje ose dërgimi të informacionit nuk është plotësisht e sigurt, por ne punojmë për ta mbrojtur.',
      ],
    },
    {
      title: 'Ruajtja e të dhënave',
      body: [
        'Të dhënat e llogarisë i ruajmë për sa kohë ekziston llogaria, dhe regjistrat e porosive për aq kohë sa duhet për t’i kryer porositë dhe për të përmbushur detyrimet ligjore.',
        { pending: 'Afatet e sakta të ruajtjes për të dhënat e llogarisë dhe të porosive ende duhet të konfirmohen.' },
      ],
    },
    {
      title: 'Zgjedhjet dhe të drejtat e tua',
      body: [
        'Mund t’i shohësh dhe përditësosh të dhënat personale në profilin tënd në çdo kohë. Mund të na shkruash edhe për të kërkuar një kopje të informacioneve të tua, ose që ato të korrigjohen apo fshihen. Do të përgjigjemi brenda një kohe të arsyeshme, me përjashtim të informacioneve që duhet t’i ruajmë, për shembull për porositë.',
        { pending: 'Të drejtat që zbatohen varen nga vendi ku vepron biznesi; ligji i zbatueshëm për mbrojtjen e të dhënave ende duhet të konfirmohet.' },
      ],
    },
    {
      title: 'Privatësia e fëmijëve',
      body: [
        'HomeMade Creator nuk është i destinuar për fëmijë dhe nuk mbledhim me vetëdije informacione nga fëmijët. Nëse mendon se një fëmijë na ka dhënë informacione, të lutem na kontakto dhe do t’i fshijmë.',
        { pending: 'Mosha minimale për përdorimin e aplikacionit ende duhet të konfirmohet.' },
      ],
    },
    {
      title: 'Ndryshimet e kësaj politike',
      body: [
        'Mund ta përditësojmë këtë politikë kur ndryshon aplikacioni. Data në krye tregon kur është përditësuar për herë të fundit.',
      ],
    },
    {
      title: 'Na kontakto',
      body: [`Ke pyetje për privatësinë tënde? Na shkruaj në ${SUPPORT_EMAIL}.`],
    },
  ],
};

/** The Privacy Policy in each app language. */
export const PRIVACY: Record<AppLanguage, LegalDocument> = { en: PRIVACY_EN, sq: PRIVACY_SQ };
