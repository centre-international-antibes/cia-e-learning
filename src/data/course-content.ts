// Types for course content steps
export interface LessonStep {
  id: string;
  type: 'lesson';
  title: string;
  content: string;
  tip?: string;
  characterId?: string;
  characterMessage?: string;
}

export interface QCMStep {
  id: string;
  type: 'qcm';
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  characterId?: string;
  characterMessage?: string;
}

export interface FillBlankStep {
  id: string;
  type: 'fill-blank';
  title: string;
  sentence: string; // use ___ for blank
  options: string[];
  correctAnswer: string;
  characterId?: string;
  characterMessage?: string;
}

export interface DragDropStep {
  id: string;
  type: 'drag-drop';
  title: string;
  instruction: string;
  items: string[];
  correctOrder: string[];
  characterId?: string;
  characterMessage?: string;
}

export interface FlashcardStep {
  id: string;
  type: 'flashcard';
  title: string;
  cards: { front: string; back: string }[];
  characterId?: string;
  characterMessage?: string;
}

export interface ListeningStep {
  id: string;
  type: 'listening';
  title: string;
  text: string; // text read by TTS
  characterId?: string; // ID of the speaking character
  characterMessage?: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface FinalQuizStep {
  id: string;
  type: 'final-quiz';
  title: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  characterId?: string;
  characterMessage?: string;
}

export type CourseStep = LessonStep | QCMStep | FillBlankStep | DragDropStep | FlashcardStep | ListeningStep | FinalQuizStep;

export interface CourseContent {
  courseId: string;
  steps: CourseStep[];
}

export const allCourseContent: CourseContent[] = [
  // ===== COURSE 1: A1 Grammaire — Articles définis/indéfinis =====
  {
    courseId: '1',
    steps: [
      {
        id: '1-1', type: 'lesson', title: 'Les articles en français', characterId: 'marie',
        characterMessage: "Bonjour à tous ! Prêts pour une nouvelle leçon ?",
        content: `En français, chaque nom est accompagné d'un **article**. Il existe deux types principaux :\n\n🔵 **Articles définis** — on connaît la chose :\n- **le** (masculin singulier) → le livre\n- **la** (féminin singulier) → la table\n- **les** (pluriel) → les enfants\n- **l'** (devant voyelle) → l'école\n\n🟢 **Articles indéfinis** — on ne précise pas :\n- **un** (masculin singulier) → un chat\n- **une** (féminin singulier) → une fleur\n- **des** (pluriel) → des amis`,
        tip: `💡 Astuce : "le/la" = je sais de quoi je parle. "un/une" = n'importe lequel.`
      },
      {
        id: '1-2', type: 'qcm', title: 'Article défini ou indéfini ?', characterId: 'lucas',
        characterMessage: "Cette question m'a piégé la première fois. Fais attention !",
        question: 'Complétez : « J\'aime ___ chocolat. »',
        options: ['un', 'le', 'des', 'la'],
        correctIndex: 1,
        explanation: 'On utilise "le" car on parle du chocolat en général (sens général = article défini).'
      },
      {
        id: '1-3', type: 'fill-blank', title: 'Complétez la phrase', characterId: 'yuki',
        sentence: 'Il y a ___ chat dans le jardin.',
        options: ['le', 'un', 'la', 'des'],
        correctAnswer: 'un'
      },
      {
        id: '1-4', type: 'qcm', title: 'Le bon article', characterId: 'omar',
        characterMessage: "Au marché d'Antibes, on entend ce genre de questions tous les jours !",
        question: 'Quel article pour « ___ école » ?',
        options: ['le', 'la', 'l\'', 'un'],
        correctIndex: 2,
        explanation: '« École » commence par une voyelle, donc on utilise l\' (élision).'
      },
      {
        id: '1-5', type: 'fill-blank', title: 'Articles au pluriel', characterId: 'fatou',
        characterMessage: "Au Sénégal, on apprend le français à l'école. C'est un exercice classique !",
        sentence: '___ enfants jouent dans le parc.',
        options: ['des', 'les', 'un', 'la'],
        correctAnswer: 'les'
      },
      {
        id: '1-6', type: 'drag-drop', title: 'Classez les articles', characterId: 'hans',
        characterMessage: "Sujet, verbe, complément — c'est la structure de base en français.",
        instruction: 'Remettez ces mots dans l\'ordre pour former une phrase correcte :',
        items: ['mange', 'une', 'Marie', 'pomme'],
        correctOrder: ['Marie', 'mange', 'une', 'pomme']
      },
      {
        id: '1-7', type: 'listening', title: 'Compréhension orale', characterId: 'elena',
        characterMessage: "Écoute attentivement ! En espagnol, ça sonnerait différemment.",
        text: 'Je vais à la boulangerie pour acheter un croissant et des pains au chocolat.',
        question: 'Que va acheter cette personne ?',
        options: ['Un croissant et des pains au chocolat', 'Le pain et la baguette', 'Une tarte et un gâteau', 'Des fruits et des légumes'],
        correctIndex: 0
      },
      {
        id: '1-8', type: 'final-quiz', title: 'Quiz final — Les articles', characterId: 'marie',
        characterMessage: "C'est l'heure du quiz ! Concentrez-vous, vous connaissez tout ça.",
        questions: [
          { question: '« ___ soleil brille. »', options: ['Un', 'Le', 'Des', 'La'], correctIndex: 1 },
          { question: '« Elle a ___ sœur. »', options: ['la', 'le', 'une', 'des'], correctIndex: 2 },
          { question: '« ___ oiseaux chantent. »', options: ['Un', 'Des', 'Les', 'La'], correctIndex: 2 },
          { question: '« J\'achète ___ livre. »', options: ['le', 'un', 'la', 'des'], correctIndex: 1 },
          { question: '« ___ eau est froide. »', options: ['La', 'Le', 'L\'', 'Une'], correctIndex: 2 },
        ]
      }
    ]
  },

  // ===== COURSE 2: A1 Vocabulaire — Se présenter =====
  {
    courseId: '2',
    steps: [
      {
        id: '2-1', type: 'lesson', title: 'Se présenter en français', characterId: 'marie',
        characterMessage: "Installez-vous confortablement, on commence !",
        content: `Pour se présenter, on utilise des phrases simples :\n\n👤 **Identité :**\n- Je m'appelle… / Mon nom est…\n- J'ai … ans\n- Je suis (nationalité)\n\n📍 **Lieu :**\n- J'habite à… / Je viens de…\n\n💼 **Profession :**\n- Je suis étudiant(e) / professeur / médecin…\n\n❤️ **Goûts :**\n- J'aime… / Je n'aime pas…\n- Mon hobby est…`,
        tip: '💡 En français, on dit "Je m\'appelle" (= I call myself), pas "Mon nom est" dans la conversation courante.'
      },
      {
        id: '2-2', type: 'flashcard', title: 'Vocabulaire clé', characterId: 'thomas',
        characterMessage: "Ces mots font partie du patrimoine culturel français !",
        cards: [
          { front: 'Comment vous appelez-vous ?', back: 'What is your name? (formal)' },
          { front: 'J\'ai vingt ans', back: 'I am twenty years old' },
          { front: 'J\'habite à Paris', back: 'I live in Paris' },
          { front: 'Je suis étudiant(e)', back: 'I am a student' },
          { front: 'Enchanté(e)', back: 'Nice to meet you' },
          { front: 'Quelle est votre nationalité ?', back: 'What is your nationality?' },
        ]
      },
      {
        id: '2-3', type: 'listening', title: 'Écoute — Présentation', characterId: 'marie',
        text: 'Bonjour, je m\'appelle Sophie. J\'ai vingt-cinq ans. J\'habite à Nice et je suis professeur de français.',
        question: 'Quel est le métier de Sophie ?',
        options: ['Étudiante', 'Médecin', 'Professeur de français', 'Avocate'],
        correctIndex: 2
      },
      {
        id: '2-4', type: 'qcm', title: 'Formule de présentation', characterId: 'elena',
        characterMessage: "En espagnol, c'est un peu pareil, mais attention aux faux amis !",
        question: 'Comment dit-on "I am 30 years old" en français ?',
        options: ['Je suis 30 ans', 'J\'ai 30 ans', 'Je fais 30 ans', 'Mon âge est 30'],
        correctIndex: 1,
        explanation: 'En français on utilise le verbe AVOIR pour l\'âge : "J\'ai 30 ans" (littéralement "I have 30 years").'
      },
      {
        id: '2-5', type: 'fill-blank', title: 'Complétez le dialogue', characterId: 'lucas',
        sentence: '— Bonjour, je ___ Maria. Et vous ?',
        options: ['suis', 'm\'appelle', 'ai', 'habite'],
        correctAnswer: 'm\'appelle'
      },
      {
        id: '2-6', type: 'drag-drop', title: 'Construisez la présentation', characterId: 'yuki',
        characterMessage: "Remets les mots dans l'ordre ! C'est comme un puzzle linguistique.",
        instruction: 'Remettez dans l\'ordre pour former une présentation :',
        items: ['ans', 'J\'ai', 'et', 'vingt', 'je', 'suis', 'espagnol'],
        correctOrder: ['J\'ai', 'vingt', 'ans', 'et', 'je', 'suis', 'espagnol']
      },
      {
        id: '2-7', type: 'final-quiz', title: 'Quiz final — Se présenter', characterId: 'marie',
        characterMessage: "Dernière étape ! Montrez-moi ce que vous avez appris.",
        questions: [
          { question: '« ___ vous appelez-vous ? »', options: ['Que', 'Comment', 'Où', 'Quand'], correctIndex: 1 },
          { question: '« J\'___ à Antibes. »', options: ['suis', 'ai', 'habite', 'appelle'], correctIndex: 2 },
          { question: '« Il ___ vingt-deux ans. »', options: ['est', 'a', 'fait', 'va'], correctIndex: 1 },
          { question: '« Je suis ___. » (nationality, female)', options: ['français', 'française', 'France', 'francais'], correctIndex: 1 },
          { question: '« ___, je m\'appelle Paul. »', options: ['Au revoir', 'Merci', 'Bonjour', 'Pardon'], correctIndex: 2 },
        ]
      }
    ]
  },

  // ===== COURSE 3: A1 Culture — Antibes =====
  {
    courseId: '3',
    steps: [
      {
        id: '3-1', type: 'lesson', title: 'Antibes et la Côte d\'Azur', characterId: 'thomas',
        characterMessage: "Bienvenue ! Je vais vous faire découvrir la culture française.",
        content: `🏖️ **Antibes** est une ville du sud-est de la France, sur la **Côte d'Azur**.\n\n📍 **Géographie :**\n- Située entre Nice et Cannes\n- Au bord de la mer Méditerranée\n- Climat ensoleillé toute l'année\n\n🏛️ **Histoire :**\n- Fondée par les Grecs (Antipolis)\n- Remparts construits par Vauban\n- Le musée Picasso dans le château Grimaldi\n\n🎉 **Culture :**\n- Festival de jazz d'Antibes Juan-les-Pins\n- Le marché provençal (fruits, olives, lavande)\n- Le Cap d'Antibes et ses villas célèbres`,
        tip: '💡 "Antipolis" signifie "la ville d\'en face" en grec ancien — car Antibes est en face de Nice.'
      },
      {
        id: '3-2', type: 'qcm', title: 'Géographie', characterId: 'elena',
        characterMessage: "Cette question est classique. Réfléchis bien avant de répondre.",
        question: 'Entre quelles deux villes se trouve Antibes ?',
        options: ['Paris et Lyon', 'Marseille et Toulon', 'Nice et Cannes', 'Bordeaux et Toulouse'],
        correctIndex: 2,
        explanation: 'Antibes est située entre Nice (à l\'est) et Cannes (à l\'ouest) sur la Côte d\'Azur.'
      },
      {
        id: '3-3', type: 'qcm', title: 'Culture', characterId: 'hans',
        characterMessage: "La rigueur allemande m'aide en grammaire française. Sois précis !",
        question: 'Quel artiste a un musée à Antibes ?',
        options: ['Monet', 'Picasso', 'Van Gogh', 'Matisse'],
        correctIndex: 1,
        explanation: 'Le musée Picasso est installé dans le château Grimaldi à Antibes.'
      },
      {
        id: '3-4', type: 'flashcard', title: 'Vocabulaire provençal', characterId: 'thomas',
        characterMessage: "À Antibes, tu entendras ces mots partout. Mémorise-les !",
        cards: [
          { front: 'La Côte d\'Azur', back: 'The French Riviera' },
          { front: 'La Méditerranée', back: 'The Mediterranean Sea' },
          { front: 'Un marché provençal', back: 'A Provençal market' },
          { front: 'La lavande', back: 'Lavender' },
          { front: 'Les remparts', back: 'The ramparts / city walls' },
        ]
      },
      {
        id: '3-5', type: 'drag-drop', title: 'Associez les éléments', characterId: 'omar',
        instruction: 'Remettez cette phrase dans l\'ordre :',
        items: ['est', 'la', 'Antibes', 'sur', 'Côte d\'Azur'],
        correctOrder: ['Antibes', 'est', 'sur', 'la', 'Côte d\'Azur']
      },
      {
        id: '3-6', type: 'listening', title: 'Compréhension orale', characterId: 'thomas',
        text: 'Antibes est une belle ville sur la Côte d\'Azur. On peut visiter le musée Picasso et le marché provençal.',
        question: 'Que peut-on visiter à Antibes ?',
        options: ['Le Louvre', 'Le musée Picasso et le marché', 'La tour Eiffel', 'Le château de Versailles'],
        correctIndex: 1
      },
      {
        id: '3-7', type: 'final-quiz', title: 'Quiz final — Antibes', characterId: 'thomas',
        questions: [
          { question: 'Antibes est au bord de quelle mer ?', options: ['Atlantique', 'Méditerranée', 'Manche', 'Mer du Nord'], correctIndex: 1 },
          { question: 'Quel festival a lieu à Juan-les-Pins ?', options: ['Festival de cinéma', 'Festival de jazz', 'Festival de théâtre', 'Festival de danse'], correctIndex: 1 },
          { question: 'Qui a fondé Antibes ?', options: ['Les Romains', 'Les Grecs', 'Les Gaulois', 'Les Espagnols'], correctIndex: 1 },
          { question: 'Que trouve-t-on au marché provençal ?', options: ['Des voitures', 'Des olives et de la lavande', 'Des ordinateurs', 'Des vêtements de luxe'], correctIndex: 1 },
          { question: 'Quel est l\'ancien nom d\'Antibes ?', options: ['Antipolis', 'Antinium', 'Antibium', 'Antarès'], correctIndex: 0 },
        ]
      }
    ]
  },

  // ===== COURSE 4: A2 Grammaire — Passé composé =====
  {
    courseId: '4',
    steps: [
      {
        id: '4-1', type: 'lesson', title: 'Le passé composé',
        content: `Le passé composé exprime une action **terminée** dans le passé.\n\n📐 **Formation :**\nSujet + **auxiliaire** (avoir ou être) au présent + **participe passé**\n\n🔵 **Avec AVOIR** (majorité des verbes) :\n- J'**ai mangé**, tu **as parlé**, il **a fini**\n\n🟢 **Avec ÊTRE** (15 verbes de mouvement + pronominaux) :\n- Je **suis allé(e)**, elle **est partie**, ils **se sont levés**\n\n⚠️ **Accord avec ÊTRE :**\nLe participe passé s'accorde avec le sujet :\n- Elle est allé**e** / Elles sont parti**es**\n\n🏠 **Les 15 verbes « DR MRS VANDERTRAMP » :**\nDevenir, Revenir, Monter, Rester, Sortir, Venir, Aller, Naître, Descendre, Entrer, Rentrer, Tomber, Retourner, Arriver, Mourir, Partir`,
        tip: '💡 Moyen mnémotechnique : "DR MRS VANDERTRAMP" pour les verbes conjugués avec être.'
      },
      {
        id: '4-2', type: 'qcm', title: 'Avoir ou être ?', characterId: 'marie',
        characterMessage: "Aujourd'hui, je vais vous expliquer quelque chose de très utile.",
        question: 'Quel auxiliaire pour « Elle ___ allée au cinéma » ?',
        options: ['a', 'est', 'va', 'fait'],
        correctIndex: 1,
        explanation: '« Aller » fait partie des verbes qui se conjuguent avec ÊTRE au passé composé.'
      },
      {
        id: '4-3', type: 'fill-blank', title: 'Conjugaison',
        sentence: 'Hier, nous ___ mangé au restaurant.',
        options: ['sommes', 'avons', 'avez', 'sont'],
        correctAnswer: 'avons'
      },
      {
        id: '4-4', type: 'fill-blank', title: 'Accord du participe', characterId: 'fatou',
        characterMessage: "Lis toute la phrase avant de choisir. Le contexte est la clé !",
        sentence: 'Marie et Sophie sont ___ au marché.',
        options: ['allé', 'allés', 'allée', 'allées'],
        correctAnswer: 'allées'
      },
      {
        id: '4-5', type: 'drag-drop', title: 'Ordre des mots',
        instruction: 'Formez une phrase au passé composé :',
        items: ['hier', 'est', 'Il', 'parti', 'matin'],
        correctOrder: ['Il', 'est', 'parti', 'hier', 'matin']
      },
      {
        id: '4-6', type: 'qcm', title: 'Participe passé', characterId: 'hans',
        characterMessage: "Prends le temps de lire tous les mots avant de les placer.",
        question: 'Quel est le participe passé de « prendre » ?',
        options: ['prendu', 'prenu', 'pris', 'prené'],
        correctIndex: 2,
        explanation: '« Prendre » → « pris ». C\'est un participe passé irrégulier qu\'il faut mémoriser.'
      },
      {
        id: '4-7', type: 'listening', title: 'Compréhension orale', characterId: 'lucas',
        characterMessage: "Écoute bien, je vais te lire quelque chose. C'est parti !",
        text: 'Ce matin, je me suis levé à sept heures. J\'ai pris mon petit déjeuner et je suis allé au travail.',
        question: 'À quelle heure s\'est-il levé ?',
        options: ['À six heures', 'À sept heures', 'À huit heures', 'À neuf heures'],
        correctIndex: 1
      },
      {
        id: '4-8', type: 'final-quiz', title: 'Quiz final — Passé composé',
        questions: [
          { question: '« J\' ___ fini mes devoirs. »', options: ['suis', 'ai', 'est', 'as'], correctIndex: 1 },
          { question: '« Elle ___ née en 1990. »', options: ['a', 'est', 'va', 'fait'], correctIndex: 1 },
          { question: '« Nous ___ voyagé en Italie. »', options: ['sommes', 'avons', 'avez', 'sont'], correctIndex: 1 },
          { question: '« Ils se ___ couchés tard. »', options: ['ont', 'sont', 'avons', 'est'], correctIndex: 1 },
          { question: 'Participe passé de « voir » ?', options: ['voiru', 'voyé', 'vu', 'vois'], correctIndex: 2 },
        ]
      }
    ]
  },

  // ===== COURSE 5: A2 Compréhension orale =====
  {
    courseId: '5',
    steps: [
      {
        id: '5-1', type: 'lesson', title: 'Comprendre une conversation',
        content: `Pour comprendre une conversation en français, concentrez-vous sur :\n\n👂 **Les mots-clés :**\n- Repérez les mots importants (noms, verbes, lieux, heures)\n- Ne cherchez pas à tout comprendre mot à mot\n\n🔑 **Les formules courantes :**\n- « Excusez-moi… » → on va demander quelque chose\n- « Je voudrais… » → on exprime un souhait\n- « Est-ce que… » → c'est une question\n\n📍 **Les indices de contexte :**\n- Le ton de voix (question, surprise, colère)\n- Les bruits de fond (restaurant, gare, téléphone)`,
        tip: '💡 Ne paniquez pas si vous ne comprenez pas tout. Concentrez-vous sur les mots-clés !'
      },
      {
        id: '5-2', type: 'listening', title: 'Au café', characterId: 'omar',
        characterMessage: "Dans ma cuisine, j'écoute toujours la radio française. Ça aide !",
        text: 'Bonjour ! Je voudrais un café et un croissant, s\'il vous plaît. C\'est combien ? Trois euros cinquante. Voilà, merci !',
        question: 'Combien coûte la commande ?',
        options: ['2,50 €', '3,50 €', '4,00 €', '5,00 €'],
        correctIndex: 1
      },
      {
        id: '5-3', type: 'listening', title: 'À la gare', characterId: 'fatou',
        characterMessage: "Au Sénégal, le français est partout. Écoute bien !",
        text: 'Excusez-moi, à quelle heure part le train pour Nice ? Le prochain train part à quatorze heures trente, quai numéro trois.',
        question: 'À quelle heure part le train ?',
        options: ['13h00', '14h30', '15h00', '16h30'],
        correctIndex: 1
      },
      {
        id: '5-4', type: 'qcm', title: 'Expressions courantes',
        question: 'Que signifie « Je voudrais » ?',
        options: ['I must', 'I would like', 'I can', 'I know'],
        correctIndex: 1,
        explanation: '« Je voudrais » est la forme polie pour exprimer un souhait = "I would like".'
      },
      {
        id: '5-5', type: 'fill-blank', title: 'Dialogue au téléphone', characterId: 'lucas',
        characterMessage: "Réfléchis bien, la réponse est plus simple qu'on ne le pense.",
        sentence: 'Allô ? Bonjour, je ___ parler à Monsieur Dupont, s\'il vous plaît.',
        options: ['veux', 'voudrais', 'peux', 'dois'],
        correctAnswer: 'voudrais'
      },
      {
        id: '5-6', type: 'listening', title: 'Au supermarché', characterId: 'yuki',
        text: 'Bonjour madame, vous avez des tomates ? Oui, elles sont à deux euros le kilo. J\'en prends un kilo, s\'il vous plaît.',
        question: 'Quel est le prix des tomates ?',
        options: ['1 €/kg', '2 €/kg', '3 €/kg', '4 €/kg'],
        correctIndex: 1
      },
      {
        id: '5-7', type: 'final-quiz', title: 'Quiz final — Compréhension orale',
        questions: [
          { question: '« S\'il vous plaît » exprime…', options: ['La colère', 'La politesse', 'La tristesse', 'La joie'], correctIndex: 1 },
          { question: '« C\'est combien ? » signifie…', options: ['Where is it?', 'What time is it?', 'How much is it?', 'Who is it?'], correctIndex: 2 },
          { question: '« Excusez-moi » s\'utilise pour…', options: ['Dire au revoir', 'Attirer l\'attention', 'Commander à manger', 'Donner un ordre'], correctIndex: 1 },
          { question: '« Allô » s\'utilise…', options: ['Au restaurant', 'Au téléphone', 'À l\'école', 'Au cinéma'], correctIndex: 1 },
          { question: '« Quai numéro 3 » se trouve…', options: ['À l\'hôpital', 'À la gare', 'Au marché', 'À la plage'], correctIndex: 1 },
        ]
      }
    ]
  },

  // ===== COURSE 6: B1 Vocabulaire — Le monde du travail =====
  {
    courseId: '6',
    steps: [
      {
        id: '6-1', type: 'lesson', title: 'Le vocabulaire professionnel',
        content: `Le monde du travail en français utilise un vocabulaire spécifique :\n\n📄 **Chercher un emploi :**\n- Un CV (curriculum vitae)\n- Une lettre de motivation\n- Un entretien d'embauche\n- Postuler à une offre d'emploi\n- Un recruteur / une recruteuse\n\n🏢 **La vie en entreprise :**\n- Un(e) collègue\n- Le/la responsable / le/la chef(fe)\n- Un contrat (CDI, CDD, intérim)\n- Le salaire / la rémunération\n- Les congés payés\n\n📊 **Les compétences :**\n- Une compétence = a skill\n- L'expérience professionnelle\n- La formation = training/education\n- Un stage = an internship`,
        tip: '💡 CDI = Contrat à Durée Indéterminée (permanent). CDD = Contrat à Durée Déterminée (temporary).'
      },
      {
        id: '6-2', type: 'flashcard', title: 'Vocabulaire du travail', characterId: 'marie',
        characterMessage: "Bienvenue dans ma classe ! Aujourd'hui, on découvre ensemble un nouveau sujet.",
        cards: [
          { front: 'Un entretien d\'embauche', back: 'A job interview' },
          { front: 'Postuler', back: 'To apply (for a job)' },
          { front: 'Un stage', back: 'An internship' },
          { front: 'Les congés payés', back: 'Paid vacation / holidays' },
          { front: 'Un contrat CDI', back: 'A permanent contract' },
          { front: 'Le salaire', back: 'The salary' },
          { front: 'Une compétence', back: 'A skill' },
          { front: 'La formation', back: 'Training / Education' },
        ]
      },
      {
        id: '6-3', type: 'qcm', title: 'Contexte professionnel',
        question: 'Que signifie « postuler à une offre d\'emploi » ?',
        options: ['Quitter son travail', 'Proposer sa candidature', 'Recevoir un salaire', 'Prendre des vacances'],
        correctIndex: 1,
        explanation: '« Postuler » signifie envoyer sa candidature (CV + lettre de motivation) pour un poste.'
      },
      {
        id: '6-4', type: 'fill-blank', title: 'Lettre de motivation', characterId: 'lucas',
        characterMessage: "J'ai fait cette erreur au début — ne tombe pas dans le piège !",
        sentence: 'Madame, Monsieur, je vous écris pour ___ au poste de commercial.',
        options: ['démissionner', 'postuler', 'travailler', 'partir'],
        correctAnswer: 'postuler'
      },
      {
        id: '6-5', type: 'listening', title: 'Entretien d\'embauche', characterId: 'hans',
        text: 'Bonjour, asseyez-vous. Parlez-moi de votre expérience professionnelle. J\'ai travaillé pendant trois ans comme assistant marketing dans une entreprise à Lyon.',
        question: 'Combien de temps a duré l\'expérience du candidat ?',
        options: ['Un an', 'Deux ans', 'Trois ans', 'Cinq ans'],
        correctIndex: 2
      },
      {
        id: '6-6', type: 'drag-drop', title: 'Processus de recrutement',
        instruction: 'Mettez les étapes dans l\'ordre chronologique :',
        items: ['Signer le contrat', 'Envoyer le CV', 'Passer l\'entretien', 'Lire l\'offre d\'emploi'],
        correctOrder: ['Lire l\'offre d\'emploi', 'Envoyer le CV', 'Passer l\'entretien', 'Signer le contrat']
      },
      {
        id: '6-7', type: 'final-quiz', title: 'Quiz final — Le monde du travail', characterId: 'hans',
        characterMessage: "La logique française est différente de l'allemande. C'est un bon entraînement !",
        questions: [
          { question: 'Un « CDI » est un contrat…', options: ['Temporaire', 'Permanent', 'De stage', 'Saisonnier'], correctIndex: 1 },
          { question: '« Les congés payés » sont…', options: ['Des jours de travail', 'Des vacances rémunérées', 'Des heures supplémentaires', 'Des formations'], correctIndex: 1 },
          { question: 'Le document qui accompagne le CV est…', options: ['Le contrat', 'La lettre de motivation', 'Le diplôme', 'La fiche de paie'], correctIndex: 1 },
          { question: '« Un stage » en anglais c\'est…', options: ['A stage', 'A step', 'An internship', 'A floor'], correctIndex: 2 },
          { question: 'Qui conduit l\'entretien d\'embauche ?', options: ['Le stagiaire', 'Le recruteur', 'Le client', 'Le livreur'], correctIndex: 1 },
        ]
      }
    ]
  },

  // ===== COURSE 7: B1 Expression orale — Donner son opinion =====
  {
    courseId: '7',
    steps: [
      {
        id: '7-1', type: 'lesson', title: 'Exprimer son opinion',
        content: `En français, il existe de nombreuses façons d'exprimer son opinion :\n\n✅ **Donner son avis :**\n- Je pense que… / Je crois que…\n- À mon avis… / Selon moi…\n- Il me semble que…\n- Je trouve que…\n\n⚖️ **Nuancer :**\n- D'un côté… de l'autre…\n- Certes… mais…\n- Il est vrai que… cependant…\n\n❌ **S'opposer :**\n- Je ne suis pas d'accord (avec)\n- Au contraire…\n- En revanche…\n\n🔗 **Connecteurs logiques :**\n- **Cause** : parce que, car, puisque\n- **Conséquence** : donc, alors, c'est pourquoi\n- **Opposition** : mais, pourtant, cependant\n- **Addition** : de plus, en outre, également`,
        tip: '💡 « Je pense que » est suivi de l\'indicatif. « Je ne pense pas que » est suivi du subjonctif !'
      },
      {
        id: '7-2', type: 'qcm', title: 'Exprimer un avis', characterId: 'marie',
        characterMessage: "Bonjour à tous ! Prêts pour une nouvelle leçon ?",
        question: 'Quelle expression signifie "In my opinion" ?',
        options: ['En effet', 'À mon avis', 'Par conséquent', 'En revanche'],
        correctIndex: 1,
        explanation: '« À mon avis » = "In my opinion". C\'est une des expressions les plus courantes pour donner son avis.'
      },
      {
        id: '7-3', type: 'fill-blank', title: 'Connecteurs logiques',
        sentence: 'J\'aime la France ___ le climat est agréable.',
        options: ['mais', 'parce que', 'donc', 'pourtant'],
        correctAnswer: 'parce que'
      },
      {
        id: '7-4', type: 'listening', title: 'Débat', characterId: 'fatou',
        characterMessage: "Ne te précipite pas, réfléchis au sens de la phrase complète.",
        text: 'À mon avis, apprendre une langue étrangère est très important. D\'un côté, cela ouvre des opportunités professionnelles. De l\'autre, cela permet de comprendre d\'autres cultures.',
        question: 'Selon le locuteur, apprendre une langue est…',
        options: ['Inutile', 'Très important', 'Facile', 'Ennuyeux'],
        correctIndex: 1
      },
      {
        id: '7-5', type: 'drag-drop', title: 'Construisez un argument',
        instruction: 'Remettez cette phrase argumentative dans l\'ordre :',
        items: ['c\'est pourquoi', 'le français', 'j\'étudie', 'est utile', 'Le français'],
        correctOrder: ['Le français', 'est utile', 'c\'est pourquoi', 'j\'étudie', 'le français']
      },
      {
        id: '7-6', type: 'qcm', title: 'Opposition', characterId: 'hans',
        characterMessage: "Cet exercice est excellent pour comprendre la syntaxe française.",
        question: 'Quel connecteur exprime l\'opposition ?',
        options: ['Parce que', 'Donc', 'Cependant', 'De plus'],
        correctIndex: 2,
        explanation: '« Cependant » exprime l\'opposition, comme « mais » ou « pourtant ».'
      },
      {
        id: '7-7', type: 'final-quiz', title: 'Quiz final — Donner son opinion',
        questions: [
          { question: '« ___ moi, c\'est une bonne idée. »', options: ['Avec', 'Selon', 'Pour', 'Dans'], correctIndex: 1 },
          { question: '« Je ___ que le sport est important. »', options: ['vais', 'pense', 'fais', 'suis'], correctIndex: 1 },
          { question: '« Certes c\'est difficile, ___ c\'est possible. »', options: ['parce que', 'mais', 'car', 'donc'], correctIndex: 1 },
          { question: '« ___ » exprime la conséquence.', options: ['Pourtant', 'Mais', 'C\'est pourquoi', 'En revanche'], correctIndex: 2 },
          { question: '« Je ne suis pas ___ avec vous. »', options: ['content', 'd\'accord', 'bien', 'sûr'], correctIndex: 1 },
        ]
      }
    ]
  },

  // ===== COURSE 8: B2 Compréhension écrite — Presse française =====
  {
    courseId: '8',
    steps: [
      {
        id: '8-1', type: 'lesson', title: 'Lire la presse française',
        content: `La presse française a ses propres codes et vocabulaire :\n\n📰 **Les grands journaux :**\n- **Le Monde** — quotidien de référence\n- **Le Figaro** — quotidien conservateur\n- **Libération** — quotidien de gauche\n- **Les Échos** — presse économique\n\n📝 **Structure d'un article :**\n- **Le titre** — souvent un jeu de mots ou une accroche\n- **Le chapeau** — résumé en 2-3 lignes\n- **Le corps** — développement avec citations\n- **L'encadré** — information complémentaire\n\n🔍 **Vocabulaire journalistique :**\n- Un éditorial = opinion du journal\n- Un reportage = article de terrain\n- Une dépêche = information brève\n- Un chroniqueur = columnist`,
        tip: '💡 Les titres de presse française utilisent souvent des jeux de mots et des références culturelles.'
      },
      {
        id: '8-2', type: 'qcm', title: 'Presse française', characterId: 'marie',
        characterMessage: "Installez-vous confortablement, on commence !",
        question: 'Quel journal est spécialisé en économie ?',
        options: ['Le Monde', 'Libération', 'Les Échos', 'Le Figaro'],
        correctIndex: 2,
        explanation: '« Les Échos » est le principal quotidien économique français.'
      },
      {
        id: '8-3', type: 'lesson', title: 'Exercice de lecture',
        content: `**Article :** « La transition écologique en France »\n\n*Le gouvernement français a annoncé un plan ambitieux de 50 milliards d'euros pour accélérer la transition écologique. Ce programme vise à réduire les émissions de gaz à effet de serre de 40% d'ici 2030. Parmi les mesures phares : le développement des énergies renouvelables, la rénovation thermique des bâtiments et le soutien aux transports en commun.\n\nLes associations environnementales saluent cette initiative tout en soulignant que les efforts restent insuffisants. « C'est un pas dans la bonne direction, mais il faut aller plus loin », déclare Marie Durand, présidente de France Nature.*`,
      },
      {
        id: '8-4', type: 'qcm', title: 'Compréhension de l\'article', characterId: 'marie',
        characterMessage: "Aujourd'hui, je vais vous expliquer quelque chose de très utile.",
        question: 'Quel est le montant du plan annoncé ?',
        options: ['30 milliards', '40 milliards', '50 milliards', '60 milliards'],
        correctIndex: 2,
        explanation: 'Le texte mentionne « un plan ambitieux de 50 milliards d\'euros ».'
      },
      {
        id: '8-5', type: 'fill-blank', title: 'Vocabulaire de presse',
        sentence: 'Les associations ___ cette initiative tout en demandant plus d\'efforts.',
        options: ['critiquent', 'saluent', 'ignorent', 'refusent'],
        correctAnswer: 'saluent'
      },
      {
        id: '8-6', type: 'flashcard', title: 'Vocabulaire journalistique', characterId: 'fatou',
        characterMessage: "Cet exercice entraîne ta grammaire et ton vocabulaire en même temps.",
        cards: [
          { front: 'Un éditorial', back: 'An editorial — opinion piece by the newspaper' },
          { front: 'Le chapeau', back: 'The lead paragraph — summary at top of article' },
          { front: 'Une dépêche', back: 'A news brief / wire story' },
          { front: 'Un chroniqueur', back: 'A columnist' },
          { front: 'Saluer une initiative', back: 'To welcome/praise an initiative' },
        ]
      },
      {
        id: '8-7', type: 'fill-blank', title: 'Synonymes en contexte',
        sentence: 'Le gouvernement veut ___ les émissions de CO2.',
        options: ['augmenter', 'réduire', 'maintenir', 'calculer'],
        correctAnswer: 'réduire'
      },
      {
        id: '8-8', type: 'final-quiz', title: 'Quiz final — Presse française', characterId: 'fatou',
        characterMessage: "Complète la phrase ! C'est comme un puzzle — trouve la pièce manquante.",
        questions: [
          { question: 'Le « chapeau » d\'un article est…', options: ['Le titre', 'Le résumé introductif', 'La conclusion', 'Une photo'], correctIndex: 1 },
          { question: '« Le Monde » est un journal…', options: ['Économique', 'Sportif', 'Généraliste de référence', 'Régional'], correctIndex: 2 },
          { question: '« Saluer une initiative » signifie…', options: ['La critiquer', 'L\'accueillir positivement', 'L\'ignorer', 'La refuser'], correctIndex: 1 },
          { question: 'Un « reportage » est…', options: ['Une opinion', 'Un article de terrain', 'Une publicité', 'Un titre'], correctIndex: 1 },
          { question: 'L\'objectif de réduction des émissions est de…', options: ['20%', '30%', '40%', '50%'], correctIndex: 2 },
        ]
      }
    ]
  },

  // ===== COURSE 9: B2 Grammaire — Le subjonctif =====
  {
    courseId: '9',
    steps: [
      {
        id: '9-1', type: 'lesson', title: 'Le subjonctif présent',
        content: `Le subjonctif est un **mode** qui exprime la subjectivité.\n\n📐 **Formation (verbes réguliers) :**\nRadical de la 3e personne du pluriel au présent + terminaisons :\n-e, -es, -e, -ions, -iez, -ent\n\nEx : Parler → ils parl**ent** → que je parl**e**\n\n⚠️ **Verbes irréguliers courants :**\n- Être → que je **sois**, que nous **soyons**\n- Avoir → que j'**aie**, que nous **ayons**\n- Aller → que j'**aille**, que nous **allions**\n- Faire → que je **fasse**, que nous **fassions**\n- Pouvoir → que je **puisse**\n- Savoir → que je **sache**\n\n🔑 **Quand l'utiliser :**\n- Après les verbes de **souhait** : Je veux que…, J'aimerais que…\n- Après les verbes d'**émotion** : Je suis content que…\n- Après les verbes de **doute** : Je doute que…\n- Après les expressions de **nécessité** : Il faut que…, Il est nécessaire que…\n- Après **certaines conjonctions** : bien que, pour que, avant que, à moins que`,
        tip: '💡 Indicatif = certitude/réalité. Subjonctif = souhait/doute/émotion/obligation.'
      },
      {
        id: '9-2', type: 'qcm', title: 'Indicatif ou subjonctif ?', characterId: 'marie',
        characterMessage: "C'est un sujet passionnant, vous allez voir !",
        question: '« Il faut que tu ___ tes devoirs. »',
        options: ['fais', 'fasses', 'fait', 'faire'],
        correctIndex: 1,
        explanation: '« Il faut que » est toujours suivi du subjonctif. Faire → que tu fasses.'
      },
      {
        id: '9-3', type: 'fill-blank', title: 'Conjugaison au subjonctif',
        sentence: 'Je suis content que vous ___ là.',
        options: ['êtes', 'soyez', 'serez', 'étiez'],
        correctAnswer: 'soyez'
      },
      {
        id: '9-4', type: 'drag-drop', title: 'Indicatif vs Subjonctif', characterId: 'fatou',
        characterMessage: "Au Sénégal, on apprend le français à l'école. C'est un exercice classique !",
        instruction: 'Classez : quelles expressions déclenchent le subjonctif ?',
        items: ['Il faut que', 'Je sais que', 'Je doute que', 'Je pense que'],
        correctOrder: ['Il faut que', 'Je doute que', 'Je sais que', 'Je pense que']
      },
      {
        id: '9-5', type: 'qcm', title: 'Verbes irréguliers',
        question: 'Subjonctif de « aller » à la 1re personne ?',
        options: ['que j\'aille', 'que j\'alle', 'que j\'allais', 'que j\'irai'],
        correctIndex: 0,
        explanation: '« Aller » au subjonctif : que j\'aille (irrégulier).'
      },
      {
        id: '9-6', type: 'fill-blank', title: 'Conjonctions + subjonctif', characterId: 'lucas',
        characterMessage: "Quand je suis arrivé à Antibes, j'ai dû apprendre ça aussi !",
        sentence: 'Je t\'explique ___ tu comprennes bien.',
        options: ['parce que', 'pour que', 'car', 'puisque'],
        correctAnswer: 'pour que'
      },
      {
        id: '9-7', type: 'listening', title: 'Compréhension',
        text: 'Il est important que les étudiants fassent leurs devoirs. Je souhaite que tout le monde soit prêt pour l\'examen.',
        question: 'Que souhaite le professeur ?',
        options: ['Que les étudiants partent', 'Que tout le monde soit prêt', 'Que l\'examen soit annulé', 'Que les devoirs soient faciles'],
        correctIndex: 1
      },
      {
        id: '9-8', type: 'final-quiz', title: 'Quiz final — Le subjonctif', characterId: 'omar',
        characterMessage: "Concentre-toi sur les mots que tu connais déjà.",
        questions: [
          { question: '« Bien que ce ___ difficile… »', options: ['est', 'soit', 'sera', 'serait'], correctIndex: 1 },
          { question: '« J\'aimerais que tu ___ venir. »', options: ['peux', 'puisses', 'pourras', 'pourrais'], correctIndex: 1 },
          { question: '« Il est nécessaire qu\'il ___. »', options: ['part', 'parte', 'partira', 'partait'], correctIndex: 1 },
          { question: '« Je doute qu\'elle ___ la vérité. »', options: ['dit', 'dise', 'dira', 'disait'], correctIndex: 1 },
          { question: '« Avant que nous ___, vérifions tout. »', options: ['partons', 'partions', 'partirons', 'partirions'], correctIndex: 1 },
        ]
      }
    ]
  },

  // ===== COURSE 10: C1 Culture — Littérature contemporaine =====
  {
    courseId: '10',
    steps: [
      {
        id: '10-1', type: 'lesson', title: 'La littérature française contemporaine',
        content: `La littérature française contemporaine (XXe-XXIe siècle) est riche et diverse :\n\n📚 **Mouvements majeurs :**\n- **L'existentialisme** (1940-60) : Sartre, Camus, Beauvoir\n  → L'homme est libre et responsable de ses choix\n- **Le Nouveau Roman** (1950-70) : Robbe-Grillet, Sarraute\n  → Rejet du roman traditionnel, expérimentation formelle\n- **L'autofiction** (1970-auj.) : Doubrovsky, Ernaux\n  → Mêler fiction et autobiographie\n\n🏆 **Prix Nobel français :**\n- Albert Camus (1957) — L'Étranger, La Peste\n- Claude Simon (1985) — La Route des Flandres\n- Patrick Modiano (2014) — thème de la mémoire\n- Annie Ernaux (2022) — récit autobiographique social\n\n✨ **Auteurs incontournables aujourd'hui :**\n- Leïla Slimani (Chanson douce)\n- Édouard Louis (En finir avec Eddy Bellegueule)\n- Virginie Despentes (Vernon Subutex)`,
        tip: '💡 Annie Ernaux, Prix Nobel 2022, est connue pour son « écriture plate » — un style volontairement simple et direct.'
      },
      {
        id: '10-2', type: 'qcm', title: 'L\'existentialisme', characterId: 'marie',
        characterMessage: "Bienvenue dans ma classe ! Aujourd'hui, on découvre ensemble un nouveau sujet.",
        question: 'Quel auteur est associé à l\'existentialisme ?',
        options: ['Victor Hugo', 'Albert Camus', 'Gustave Flaubert', 'Marcel Proust'],
        correctIndex: 1,
        explanation: 'Albert Camus est un des auteurs majeurs de l\'existentialisme avec Sartre et Beauvoir.'
      },
      {
        id: '10-3', type: 'flashcard', title: 'Œuvres et auteurs',
        cards: [
          { front: 'L\'Étranger', back: 'Albert Camus (1942) — Récit d\'un homme indifférent au monde' },
          { front: 'Chanson douce', back: 'Leïla Slimani (2016) — Prix Goncourt, thriller sur la maternité' },
          { front: 'Les Mots', back: 'Jean-Paul Sartre (1964) — Autobiographie philosophique' },
          { front: 'Les Années', back: 'Annie Ernaux (2008) — Récit autobiographique collectif' },
          { front: 'Vernon Subutex', back: 'Virginie Despentes (2015) — Trilogie sur la société française' },
        ]
      },
      {
        id: '10-4', type: 'qcm', title: 'Prix Nobel',
        question: 'Qui a reçu le Prix Nobel de littérature en 2022 ?',
        options: ['Patrick Modiano', 'Leïla Slimani', 'Annie Ernaux', 'Virginie Despentes'],
        correctIndex: 2,
        explanation: 'Annie Ernaux a reçu le Prix Nobel de littérature en 2022 pour son œuvre autobiographique.'
      },
      {
        id: '10-5', type: 'drag-drop', title: 'Chronologie littéraire', characterId: 'lucas',
        characterMessage: "Moi aussi au début, je trouvais ça compliqué ! Mais on s'y habitue.",
        instruction: 'Classez ces mouvements dans l\'ordre chronologique :',
        items: ['Autofiction', 'Existentialisme', 'Nouveau Roman'],
        correctOrder: ['Existentialisme', 'Nouveau Roman', 'Autofiction']
      },
      {
        id: '10-6', type: 'fill-blank', title: 'Compréhension',
        sentence: 'Le Nouveau Roman rejette le roman ___ et privilégie l\'expérimentation formelle.',
        options: ['moderne', 'traditionnel', 'romantique', 'classique'],
        correctAnswer: 'traditionnel'
      },
      {
        id: '10-7', type: 'listening', title: 'Extrait', characterId: 'fatou',
        characterMessage: "Lis toute la phrase avant de choisir. Le contexte est la clé !",
        text: 'Aujourd\'hui, maman est morte. Ou peut-être hier, je ne sais pas. C\'est le début du roman L\'Étranger d\'Albert Camus, publié en mille neuf cent quarante-deux.',
        question: 'De quel roman est tiré cet extrait ?',
        options: ['La Peste', 'L\'Étranger', 'Les Mots', 'La Nausée'],
        correctIndex: 1
      },
      {
        id: '10-8', type: 'final-quiz', title: 'Quiz final — Littérature contemporaine',
        questions: [
          { question: 'L\'existentialisme affirme que l\'homme est…', options: ['Déterminé', 'Libre', 'Passif', 'Inconscient'], correctIndex: 1 },
          { question: '« L\'Étranger » a été écrit par…', options: ['Sartre', 'Camus', 'Modiano', 'Ernaux'], correctIndex: 1 },
          { question: 'L\'autofiction mêle…', options: ['Poésie et théâtre', 'Fiction et autobiographie', 'Science et philosophie', 'Histoire et géographie'], correctIndex: 1 },
          { question: 'Patrick Modiano explore le thème de…', options: ['L\'amour', 'La mémoire', 'La nature', 'La guerre'], correctIndex: 1 },
          { question: 'Le Prix Goncourt de Leïla Slimani récompense…', options: ['Les Années', 'Chanson douce', 'Vernon Subutex', 'L\'Étranger'], correctIndex: 1 },
        ]
      }
    ]
  },
];

// Import curriculum-based content
import { a1Module1Content } from './a1-module1-content';
import { a1Module2Content } from './a1-module2-content';
import { a2Module1Content } from './a2-module1-content';
import { a2Module2Content } from './a2-module2-content';
import { a2Module3Content } from './a2-module3-content';
import { a2Module4Content } from './a2-module4-content';
import { a2Module5Content } from './a2-module5-content';
import { b1Module1Content } from './b1-module1-content';
import { b1Module2Content } from './b1-module2-content';
import { b1Module3Content } from './b1-module3-content';
import { b1Module4Content } from './b1-module4-content';
import { b1Module5Content } from './b1-module5-content';
import { b2Module1Content } from './b2-module1-content';
import { b2Module2Content } from './b2-module2-content';
import { b2Module3Content } from './b2-module3-content';
import { b2Module4Content } from './b2-module4-content';
import { b2Module5Content } from './b2-module5-content';

// Merge all content: legacy demo courses + curriculum lessons.
// Exporté : `lib/lessonSpec` en dérive le référentiel `lesson_xp_spec` (XP serveur).
export const allContent = [
  ...allCourseContent,
  ...a1Module1Content,
  ...a1Module2Content,
  ...a2Module1Content,
  ...a2Module2Content,
  ...a2Module3Content,
  ...a2Module4Content,
  ...a2Module5Content,
  ...b1Module1Content,
  ...b1Module2Content,
  ...b1Module3Content,
  ...b1Module4Content,
  ...b1Module5Content,
  ...b2Module1Content,
  ...b2Module2Content,
  ...b2Module3Content,
  ...b2Module4Content,
  ...b2Module5Content,
];

export function getCourseContent(courseId: string): CourseContent | undefined {
  return allContent.find(c => c.courseId === courseId);
}
