// --- Data ---
// cspell:ignoreRegExp /export const QUESTIONS = \[[\s\S]*?\];/
export const QUESTIONS = [
  {
    q: 'What is the capital of Japan?',
    a: ['Beijing', 'Seoul', 'Tokyo', 'Kyoto'],
    c: 2,
    e: 'Tokyo is the capital of Japan.',
    context:
      "Tokyo, formerly known as Edo, became the capital of Japan in 1868. It is one of the world's most populous cities and a major center for finance, culture, and technology. Tokyo hosts the Imperial Palace and is famous for its blend of traditional and modern architecture.",
  },
  {
    q: 'Who wrote "Romeo and Juliet"?',
    a: ['Mark Twain', 'William Shakespeare', 'Charles Dickens', 'Jane Austen'],
    c: 1,
    e: 'William Shakespeare wrote Romeo and Juliet.',
    context:
      'William Shakespeare was an English playwright and poet, widely regarded as the greatest writer in the English language. "Romeo and Juliet" is one of his most famous tragedies, exploring themes of love, fate, and family conflict in Renaissance Italy.',
  },
  {
    q: 'Which planet has the most moons in our solar system?',
    a: ['Mars', 'Earth', 'Jupiter', 'Venus'],
    c: 2,
    e: 'Jupiter has the most known moons.',
    context:
      'Jupiter has over 90 known moons, including Ganymede, the largest moon in the solar system. Its strong gravity allows it to capture many objects as moons. Saturn also has many moons, but Jupiter currently holds the record.',
  },
  {
    q: 'What gas do plants use for photosynthesis?',
    a: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'],
    c: 1,
    e: 'Plants use carbon dioxide for photosynthesis.',
    context:
      'Photosynthesis is the process by which plants convert carbon dioxide and water into glucose and oxygen using sunlight. This process is essential for life on Earth, as it provides oxygen and food for many organisms.',
  },
  {
    q: 'Who painted the Sistine Chapel ceiling?',
    a: ['Raphael', 'Leonardo da Vinci', 'Michelangelo', 'Donatello'],
    c: 2,
    e: 'Michelangelo painted the Sistine Chapel ceiling.',
    context:
      'Michelangelo was an Italian Renaissance artist known for his sculptures and paintings. The Sistine Chapel ceiling, painted between 1508 and 1512, features scenes from the Book of Genesis and is considered a masterpiece of Western art.',
  },
  {
    q: 'What is the largest continent by land area?',
    a: ['Africa', 'Asia', 'Europe', 'Antarctica'],
    c: 1,
    e: 'Asia is the largest continent by land area.',
    context:
      "Asia covers about 30% of Earth's land area and is home to more than half of the world's population. It includes diverse regions such as the Middle East, South Asia, East Asia, and Siberia.",
  },
  {
    q: 'Which element has the chemical symbol "O"?',
    a: ['Gold', 'Oxygen', 'Silver', 'Iron'],
    c: 1,
    e: 'O is the symbol for oxygen.',
    context:
      "Oxygen is a vital element for life, making up about 21% of Earth's atmosphere. It is essential for respiration in most living organisms and is highly reactive, forming compounds with many other elements.",
  },
  {
    q: 'In which year did the first man land on the moon?',
    a: ['1969', '1959', '1979', '1965'],
    c: 0,
    e: 'The first moon landing was in 1969.',
    context:
      'Apollo 11 was the mission that first landed humans on the Moon. Neil Armstrong and Buzz Aldrin walked on the lunar surface, while Michael Collins orbited above. The event marked a major milestone in space exploration.',
  },
  {
    q: 'What is the smallest prime number?',
    a: ['0', '1', '2', '3'],
    c: 2,
    e: '2 is the smallest prime number.',
    context:
      'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. 2 is the only even prime number, as all other even numbers are divisible by 2.',
  },
  {
    q: 'Which ocean lies on the east coast of the United States?',
    a: ['Pacific', 'Atlantic', 'Indian', 'Arctic'],
    c: 1,
    e: 'The Atlantic Ocean is on the east coast.',
    context:
      'The Atlantic Ocean is the second-largest ocean and separates North America from Europe and Africa. Major cities like New York, Miami, and Boston are located along its coast.',
  },
  {
    q: 'What currency is used in the United Kingdom?',
    a: ['Euro', 'Pound', 'Dollar', 'Franc'],
    c: 1,
    e: 'The British pound is the currency of the UK.',
    context:
      'The pound sterling, commonly known as the pound, is the official currency of the United Kingdom. It is one of the oldest currencies still in use and is subdivided into 100 pence.',
  },
  {
    q: 'Who discovered penicillin?',
    a: ['Alexander Fleming', 'Marie Curie', 'Louis Pasteur', 'Gregor Mendel'],
    c: 0,
    e: 'Alexander Fleming discovered penicillin.',
    context:
      'Penicillin was the first true antibiotic discovered by Alexander Fleming in 1928. It has saved countless lives by effectively treating bacterial infections.',
  },
  {
    q: 'What is the human body organ that pumps blood?',
    a: ['Liver', 'Lung', 'Heart', 'Kidney'],
    c: 2,
    e: 'The heart pumps blood in the body.',
    context:
      'The heart is a muscular organ about the size of a fist, located slightly left of the center of the chest. It pumps blood through the circulatory system, supplying oxygen and nutrients to the body.',
  },
  {
    q: 'Which country is known for the pyramids at Giza?',
    a: ['Mexico', 'Peru', 'Egypt', 'Sudan'],
    c: 2,
    e: 'Egypt is famous for the pyramids at Giza.',
    context:
      'The Giza pyramid complex is one of the most famous archaeological sites in the world. The Great Pyramid of Giza is the largest pyramid in Egypt and one of the Seven Wonders of the Ancient World.',
  },
  {
    q: 'Which language has the most native speakers worldwide?',
    a: ['English', 'Spanish', 'Mandarin', 'Hindi'],
    c: 2,
    e: 'Mandarin Chinese has the most native speakers.',
    context:
      'Mandarin is the most widely spoken language in the world, with over a billion native speakers. It is the official language of China and Taiwan, and one of the official languages of Singapore.',
  },
  {
    q: 'What is H2O commonly called?',
    a: ['Salt', 'Hydrogen', 'Water', 'Oxygen'],
    c: 2,
    e: 'H2O is the chemical formula for water.',
    context:
      "Water is essential for all known forms of life. It covers about 71% of Earth's surface and is vital for drinking, agriculture, and industry.",
  },
  {
    q: 'Which metal is liquid at room temperature?',
    a: ['Mercury', 'Gold', 'Silver', 'Copper'],
    c: 0,
    e: 'Mercury is liquid at room temperature.',
    context:
      'Mercury is the only metal that is liquid at standard conditions for temperature and pressure. It is used in thermometers, barometers, and some electrical switches.',
  },
  {
    q: 'What is the fastest land animal?',
    a: ['Lion', 'Cheetah', 'Horse', 'Kangaroo'],
    c: 1,
    e: 'The cheetah is the fastest land animal.',
    context:
      'The cheetah can reach speeds of up to 75 miles per hour (120 kilometers per hour) in short bursts covering distances up to 500 meters. It is built for speed with a lightweight body and long legs.',
  },
  {
    q: 'Which organ in plants makes food using sunlight?',
    a: ['Root', 'Stem', 'Leaf', 'Flower'],
    c: 2,
    e: 'Leaves perform photosynthesis to make food.',
    context:
      'Photosynthesis occurs in the chloroplasts of plant cells, which contain chlorophyll that captures sunlight. This process converts carbon dioxide and water into glucose and oxygen.',
  },
  {
    q: 'Who composed the Fifth Symphony known as "fate"?',
    a: ['Mozart', 'Beethoven', 'Bach', 'Chopin'],
    c: 1,
    e: 'Beethoven composed the Fifth Symphony.',
    context:
      'Ludwig van Beethoven was a German composer and pianist. His Fifth Symphony, composed between 1804 and 1808, is one of the most performed symphonies and is known for its distinctive four-note motif.',
  },
  {
    q: 'What is the boiling point of water at sea level in Celsius?',
    a: ['90', '95', '100', '105'],
    c: 2,
    e: 'Water boils at 100 degrees Celsius at sea level.',
    context:
      'The boiling point of water can change depending on the atmospheric pressure. At higher altitudes, water boils at a lower temperature due to reduced pressure.',
  },
  {
    q: 'Which city is known as the Big Apple?',
    a: ['Los Angeles', 'Chicago', 'New York', 'Miami'],
    c: 2,
    e: 'New York City is nicknamed the Big Apple.',
    context:
      'The nickname "The Big Apple" originally referred to New York City\'s horse racing tracks. It later became popularized in the 1970s and is now a widely recognized nickname for the city.',
  },
  {
    q: 'What is the longest river in the world by length?',
    a: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'],
    c: 0,
    e: 'The Nile has long been considered the longest.',
    context:
      'The Nile River in Africa is approximately 6650 kilometers (4130 miles) long. It flows through eleven countries and is essential for agriculture and water supply in the region.',
  },
  {
    q: 'Which planet is closest to the Sun?',
    a: ['Venus', 'Mercury', 'Earth', 'Mars'],
    c: 1,
    e: 'Mercury is the planet closest to the Sun.',
    context:
      'Mercury is the smallest planet in our solar system and orbits the Sun at an average distance of about 57.91 million kilometers (36 million miles).',
  },
  {
    q: 'Who developed the theory of relativity?',
    a: ['Isaac Newton', 'Albert Einstein', 'Niels Bohr', 'Galileo'],
    c: 1,
    e: 'Albert Einstein developed the theory of relativity.',
    context:
      "Einstein's theory of relativity, published in 1905, revolutionized our understanding of space, time, and gravity. It introduced the famous equation E=mc², linking energy and mass.",
  },
  {
    q: 'What is the main language spoken in Brazil?',
    a: ['Spanish', 'Portuguese', 'French', 'English'],
    c: 1,
    e: 'Portuguese is the main language in Brazil.',
    context:
      "Brazil is the largest country in South America and the only one in the region where Portuguese is the official language. This is due to Brazil's colonization by Portugal in the 16th century.",
  },
  {
    q: 'What instrument has keys, pedals, and strings?',
    a: ['Guitar', 'Violin', 'Piano', 'Flute'],
    c: 2,
    e: 'The piano has keys, pedals, and strings.',
    context:
      'The piano is a musical instrument played by pressing keys that cause hammers to strike strings, producing sound. It is widely used in classical and popular music.',
  },
  {
    q: 'Which country gifted the Statue of Liberty to the USA?',
    a: ['Germany', 'France', 'Italy', 'Spain'],
    c: 1,
    e: 'France gifted the Statue of Liberty to the USA.',
    context:
      'The Statue of Liberty was a gift from the people of France to the United States, dedicated in 1886. It was designed by French sculptor Frédéric Auguste Bartholdi and symbolizes freedom and democracy.',
  },
  {
    q: "Which gas is most abundant in Earth's atmosphere?",
    a: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'],
    c: 2,
    e: 'Nitrogen is the most abundant gas in the atmosphere.',
    context:
      "Nitrogen makes up about 78% of Earth's atmosphere by volume. It is a colorless, odorless gas that is essential for life, as it is a key component of amino acids and nucleic acids.",
  },
  {
    q: 'What is the chemical symbol for gold?',
    a: ['Au', 'Ag', 'Gd', 'Go'],
    c: 0,
    e: 'Au is the chemical symbol for gold.',
    context:
      'Gold is a dense, malleable metal with the chemical symbol Au (from Latin: aurum) and atomic number 79. It is highly valued for its use in jewelry, currency, and other arts.',
  },
  {
    q: 'Who painted "The Starry Night"?',
    a: ['Paul Cezanne', 'Vincent van Gogh', 'Pablo Picasso', 'Claude Monet'],
    c: 1,
    e: 'Vincent van Gogh painted The Starry Night.',
    context:
      "The Starry Night is one of Vincent van Gogh's most famous paintings, created in 1889. It depicts a swirling night sky over a quiet town, expressing van Gogh's emotional turmoil and fascination with the night.",
  },
  {
    q: 'Which year did World War 2 end?',
    a: ['1944', '1945', '1946', '1947'],
    c: 1,
    e: 'World War 2 ended in 1945.',
    context:
      "World War 2 was a global conflict that lasted from 1939 to 1945. It involved most of the world's nations and resulted in significant changes to the global political and social landscape.",
  },
  {
    q: 'What is the largest mammal?',
    a: ['Elephant', 'Blue whale', 'Giraffe', 'Hippopotamus'],
    c: 1,
    e: 'The blue whale is the largest mammal.',
    context:
      'The blue whale is the largest animal known to have ever existed, reaching lengths of up to 100 feet (30 meters) and weights of up to 200 tons. They are found in oceans worldwide and primarily eat small shrimp-like animals called krill.',
  },
  {
    q: 'Which element is needed to make steel?',
    a: ['Carbon', 'Helium', 'Nitrogen', 'Neon'],
    c: 0,
    e: 'Carbon is combined with iron to make steel.',
    context:
      'Steel is an alloy made primarily of iron and carbon. The carbon content determines the hardness and strength of the steel. Other elements may also be added to create different types of steel.',
  },
  {
    q: 'Who is the author of the Harry Potter series?',
    a: ['C S Lewis', 'J R R Tolkien', 'J K Rowling', 'Philip Pullman'],
    c: 2,
    e: 'J K Rowling wrote the Harry Potter series.',
    context:
      'The Harry Potter series is a globally popular fantasy book series written by J.K. Rowling. It follows the life and adventures of a young wizard, Harry Potter, and his friends.',
  },
  {
    q: 'Which country uses the Yen as its currency?',
    a: ['China', 'Japan', 'South Korea', 'Vietnam'],
    c: 1,
    e: 'Japan uses the Yen as its currency.',
    context:
      'The yen is the official currency of Japan, introduced in 1871. It is one of the most traded currencies in the world and is known for its stability.',
  },
  {
    q: 'Which vitamin is produced when skin is exposed to sunlight?',
    a: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'],
    c: 3,
    e: 'Vitamin D is produced in skin after sunlight exposure.',
    context:
      'Vitamin D is essential for maintaining healthy bones and teeth, and it plays a role in immune system function. The body produces vitamin D in response to skin being exposed to sunlight.',
  },
  {
    q: 'What is the tallest mountain in the world above sea level?',
    a: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'],
    c: 2,
    e: 'Mount Everest is the tallest above sea level.',
    context:
      "Mount Everest, located in the Himalayas on the border of Nepal and the Tibet Autonomous Region of China, is the Earth's highest mountain above sea level, with a peak at 8848.86 meters (29031.7 ft).",
  },
  {
    q: 'What device converts alternating current to direct current?',
    a: ['Transformer', 'Rectifier', 'Generator', 'Inverter'],
    c: 1,
    e: 'A rectifier converts AC to DC.',
    context:
      'A rectifier is an electrical device that converts alternating current (AC) to direct current (DC). It allows current to flow in one direction only, effectively converting the AC waveform to a DC waveform.',
  },
  {
    q: 'Which two colors make green when mixed in paint?',
    a: ['Red and Blue', 'Blue and Yellow', 'Red and Yellow', 'Blue and Green'],
    c: 1,
    e: 'Blue and yellow mix to make green.',
    context:
      'In color theory, blue and yellow are primary colors that, when mixed together, create green, which is a secondary color. This is due to the way our eyes perceive color and the way light wavelengths combine.',
  },
  {
    q: 'Who was the first president of United States?',
    a: [
      'Abraham Lincoln',
      'George Washington',
      'Thomas Jefferson',
      'John Adams',
    ],
    c: 1,
    e: 'George Washington was the first president of United States.',
    context:
      'George Washington was unanimously elected as the first President of the United States in 1788. He served two terms from 1789 to 1797 and is often called the "Father of His Country".',
  },
  {
    q: 'Which organ breaks down food and absorbs nutrients?',
    a: ['Lung', 'Kidney', 'Stomach and intestine', 'Heart'],
    c: 2,
    e: 'Stomach and intestines digest and absorb nutrients.',
    context:
      'The digestive system breaks down food into smaller molecules, which are then absorbed into the bloodstream through the walls of the intestines. The stomach and intestines play key roles in this process.',
  },
  {
    q: 'Which bird is known for its ability to mimic human speech?',
    a: ['Eagle', 'Parrot', 'Sparrow', 'Ostrich'],
    c: 1,
    e: 'Parrots can mimic human speech.',
    context:
      'Some species of parrots are known for their ability to imitate human speech and other sounds. This ability varies among individual birds and is thought to be a form of social learning.',
  },
  {
    q: 'What is the study of past human activity called?',
    a: ['Anthropology', 'Archaeology', 'Sociology', 'Geology'],
    c: 1,
    e: 'Archaeology studies past human activity.',
    context:
      'Archaeology is the scientific study of ancient cultures and human activity through the examination of artifacts, structures, and other physical remains.',
  },
  {
    q: 'Which substance makes up the majority of the Sun?',
    a: ['Iron', 'Hydrogen', 'Carbon', 'Silicon'],
    c: 1,
    e: 'Hydrogen is the main element in the Sun.',
    context:
      'The Sun is composed of about 74% hydrogen, 24% helium, and 2% heavier elements. Hydrogen is the primary fuel for the nuclear fusion reactions that power the Sun.',
  },
  {
    q: 'Who invented the telephone?',
    a: [
      'Thomas Edison',
      'Alexander Graham Bell',
      'Nikola Tesla',
      'Guglielmo Marconi',
    ],
    c: 1,
    e: 'Alexander Graham Bell is credited with the telephone.',
    context:
      'Alexander Graham Bell was a Scottish-born inventor, scientist, and teacher who is credited with inventing the first practical telephone. He was awarded the first US patent for the invention of the telephone.',
  },
  {
    q: 'What is the capital of Canada?',
    a: ['Toronto', 'Montreal', 'Vancouver', 'Ottawa'],
    c: 3,
    e: 'Ottawa is the capital of Canada.',
    context:
      'Ottawa is the capital city of Canada, located in the province of Ontario. It became the capital in 1857 and is home to many national institutions, including the Parliament of Canada.',
  },
  {
    q: 'Which planet is known for its rings?',
    a: ['Mars', 'Jupiter', 'Saturn', 'Uranus'],
    c: 2,
    e: 'Saturn is famous for its rings.',
    context:
      "Saturn is the sixth planet from the Sun and is known for its prominent ring system, which is made up of ice particles, rocky debris, and dust. The rings are thought to be remnants of moons or comets that were torn apart by Saturn's gravity.",
  },
  {
    q: 'Which chemical is used as table salt?',
    a: ['Sodium chloride', 'Potassium', 'Magnesium', 'Calcium'],
    c: 0,
    e: 'Table salt is sodium chloride.',
    context:
      'Table salt is chemically known as sodium chloride (NaCl). It is composed of sodium ions and chloride ions and is used in food preparation and preservation.',
  },
  {
    q: 'Who painted "Guernica"?',
    a: ['Salvador Dali', 'Pablo Picasso', 'Henri Matisse', 'Jackson Pollock'],
    c: 1,
    e: 'Pablo Picasso painted Guernica.',
    context:
      'Guernica is a mural-sized oil painting on canvas by Spanish artist Pablo Picasso, completed in 1937. It is one of the most famous anti-war artworks, depicting the suffering caused by war and violence.',
  },
  {
    q: 'What is the largest desert in the world?',
    a: ['Sahara', 'Gobi', 'Arabian', 'Antarctic desert'],
    c: 3,
    e: 'The Antarctic is the largest desert by area.',
    context:
      'The Antarctic Desert is the largest desert in the world, covering an area of about 14 million square kilometers (5.5 million square miles). It is classified as a desert due to its extremely low humidity and precipitation.',
  },
  {
    q: 'Which sport uses a shuttlecock?',
    a: ['Tennis', 'Badminton', 'Squash', 'Table tennis'],
    c: 1,
    e: 'Badminton uses a shuttlecock.',
    context:
      "Badminton is a racquet sport played using shuttlecocks and a lightweight racquet. The game is played on a rectangular court divided by a net, and the objective is to hit the shuttlecock over the net and into the opponent's court.",
  },
  {
    q: 'What is the freezing point of water in Fahrenheit?',
    a: ['0', '32', '100', '212'],
    c: 1,
    e: 'Water freezes at 32 degrees Fahrenheit.',
    context:
      'The freezing point of water is 32 degrees Fahrenheit (0 degrees Celsius) at standard atmospheric pressure. At this temperature, water molecules slow down and form a crystalline structure, resulting in ice.',
  },
  {
    q: 'Which continent has the most countries?',
    a: ['Asia', 'Africa', 'Europe', 'South America'],
    c: 1,
    e: 'Africa has the most countries of any continent.',
    context:
      'Africa is the second-largest and second-most populous continent, with 54 recognized sovereign states. It has a diverse range of cultures, languages, and ecosystems.',
  },
  {
    q: 'What is the main ingredient in traditional sushi?',
    a: ['Beef', 'Rice', 'Potatoes', 'Cheese'],
    c: 1,
    e: 'Rice is the main ingredient in sushi.',
    context:
      'Sushi is a Japanese dish typically made with vinegared rice, raw fish, and other ingredients like vegetables and seaweed. The rice is the essential component that defines sushi.',
  },
  {
    q: 'Which famous physicist wrote "A Brief History of Time"?',
    a: ['Richard Feynman', 'Stephen Hawking', 'Carl Sagan', 'Brian Cox'],
    c: 1,
    e: 'Stephen Hawking wrote A Brief History of Time.',
    context:
      'A Brief History of Time is a popular science book written by physicist Stephen Hawking. It explains complex concepts in cosmology, such as the Big Bang, black holes, and light cones, in accessible language.',
  },
  {
    q: 'Which city is the capital of Australia?',
    a: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    c: 2,
    e: 'Canberra is the capital of Australia.',
    context:
      'Canberra is the capital city of Australia, located in the Australian Capital Territory. It was selected as the capital in 1908 as a compromise between rivals Sydney and Melbourne.',
  },
  {
    q: 'What is the largest organ in the human body?',
    a: ['Liver', 'Skin', 'Heart', 'Brain'],
    c: 1,
    e: 'Skin is the largest organ of the human body.',
    context:
      "The skin is the body's largest organ, covering an area of about 2 square meters (22 square feet) in adults. It protects internal organs, regulates temperature, and enables the sense of touch.",
  },
  {
    q: 'Which gas do humans inhale to survive?',
    a: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Helium'],
    c: 2,
    e: 'Humans inhale oxygen to survive.',
    context:
      'Oxygen is essential for human survival as it is required for cellular respiration, the process by which cells produce energy. Humans inhale air containing oxygen through the respiratory system.',
  },
  {
    q: 'Who developed the theory of evolution by natural selection?',
    a: ['Gregor Mendel', 'Charles Darwin', 'Louis Pasteur', 'Alfred Wallace'],
    c: 1,
    e: 'Charles Darwin proposed natural selection.',
    context:
      'Charles Darwin was an English naturalist, geologist, and biologist best known for his contributions to the science of evolution. He proposed the theory of natural selection as the mechanism of evolution.',
  },
  {
    q: 'What instrument measures temperature?',
    a: ['Barometer', 'Thermometer', 'Hygrometer', 'Ammeter'],
    c: 1,
    e: 'A thermometer measures temperature.',
    context:
      'A thermometer is a device that measures temperature, typically using a glass tube filled with mercury or alcohol that expands and contracts with temperature changes.',
  },
  {
    q: 'Which country has the largest population?',
    a: ['India', 'United States', 'China', 'Russia'],
    c: 2,
    e: 'China has the largest population.',
    context:
      'China is the most populous country in the world, with a population of over 1.4 billion people. It is followed by India, the United States, and Indonesia.',
  },
  {
    q: 'What is the chemical formula for table sugar (sucrose)?',
    a: ['C6H12O6', 'C12H22O11', 'H2O', 'CO2'],
    c: 1,
    e: 'Sucrose has formula C12H22O11.',
    context:
      'Table sugar, or sucrose, is a carbohydrate composed of glucose and fructose units. It is commonly used as a sweetener in food and drinks.',
  },
  {
    q: 'Which author wrote "Pride and Prejudice"?',
    a: ['Emily Bronte', 'Charlotte Bronte', 'Jane Austen', 'Mary Shelley'],
    c: 2,
    e: 'Jane Austen wrote Pride and Prejudice.',
    context:
      'Pride and Prejudice is a novel written by Jane Austen, published in 1813. It is a romantic fiction that critiques the British landed gentry at the end of the 18th century.',
  },
  {
    q: 'What is the largest island in the world?',
    a: ['Greenland', 'Madagascar', 'Borneo', 'New Guinea'],
    c: 0,
    e: 'Greenland is the largest island.',
    context:
      "Greenland is the world's largest island that is not a continent. It is located between the Arctic and Atlantic Oceans and is an autonomous territory within the Kingdom of Denmark.",
  },
  {
    q: 'Which planet is known as the Red Planet?',
    a: ['Earth', 'Mars', 'Venus', 'Mercury'],
    c: 1,
    e: 'Mars is known as the Red Planet.',
    context:
      'Mars is often called the Red Planet because of its reddish appearance, which is due to iron oxide (rust) on its surface. It is the fourth planet from the Sun and has the largest dust storms in the solar system.',
  },
  {
    q: 'Who is credited with inventing the light bulb?',
    a: ['Nikola Tesla', 'Thomas Edison', 'Alexander Graham Bell', 'James Watt'],
    c: 1,
    e: 'Thomas Edison is commonly credited for the light bulb.',
    context:
      'Thomas Edison was an American inventor and businessman who is credited with developing the first commercially successful incandescent light bulb.',
  },
  {
    q: 'What is the capital of Italy?',
    a: ['Milan', 'Naples', 'Rome', 'Florence'],
    c: 2,
    e: 'Rome is the capital of Italy.',
    context:
      'Rome, the "Eternal City", is the capital of Italy and of the Lazio region. It is known for its nearly 3000 years of globally influential art, architecture, and culture.',
  },
  {
    q: 'Which metal has the highest electrical conductivity?',
    a: ['Gold', 'Silver', 'Copper', 'Aluminum'],
    c: 1,
    e: 'Silver has the highest conductivity of common metals.',
    context:
      'Silver is a metal known for its high electrical conductivity, thermal conductivity, and reflectivity. It is used in electrical contacts, conductors, and in various electronic devices.',
  },
  {
    q: 'What is the largest city in India by population?',
    a: ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata'],
    c: 1,
    e: 'Mumbai is the largest city by population in India.',
    context:
      'Mumbai, formerly known as Bombay, is the most populous city in India and the seventh most populous city in the world. It is the financial, commercial, and entertainment hub of India.',
  },
  {
    q: 'Which mountain range includes Mount Kilimanjaro?',
    a: [
      'Andes',
      'Himalayas',
      'Kilimanjaro is a standalone mountain',
      'Rockies',
    ],
    c: 2,
    e: 'Kilimanjaro is a free standing mountain, not part of a range.',
    context:
      'Mount Kilimanjaro is a dormant stratovolcano located in Tanzania. It is the highest mountain in Africa, standing at 5895 meters (19341 feet) above sea level.',
  },
  {
    q: 'Which animal is known as the king of the jungle?',
    a: ['Tiger', 'Elephant', 'Lion', 'Bear'],
    c: 2,
    e: 'The lion is often called the king of the jungle.',
    context:
      'The lion is a large cat species found in Africa and India. It is known for its strength, courage, and majestic appearance. The term "king of the jungle" is a colloquial expression and lions actually inhabit grasslands and savannas.',
  },
  {
    q: 'What is the primary language of Egypt?',
    a: ['Arabic', 'English', 'French', 'Greek'],
    c: 0,
    e: 'Arabic is the primary language in Egypt.',
    context:
      'Arabic is the official language of Egypt and is spoken by the vast majority of the population. Egypt is also known for its ancient civilization and historical monuments.',
  },
  {
    q: 'Which country has the largest area in the world?',
    a: ['United States', 'China', 'Russia', 'Canada'],
    c: 2,
    e: 'Russia is the largest country by area.',
    context:
      'Russia is the largest country in the world by land area, covering more than 17 million square kilometers. It spans Eastern Europe and northern Asia, and has a wide range of environments and landscapes.',
  },
  {
    q: 'Who painted the Mona Lisa?',
    a: ['Michelangelo', 'Leonardo da Vinci', 'Rembrandt', 'Raphael'],
    c: 1,
    e: 'Leonardo da Vinci painted the Mona Lisa.',
    context:
      'The Mona Lisa is a half-length portrait painting by the Italian Renaissance artist Leonardo da Vinci. It is considered an archetypal masterpiece of the Italian Renaissance and is one of the most famous paintings in the world.',
  },
  {
    q: 'Which chemical element has atomic number 1?',
    a: ['Helium', 'Hydrogen', 'Oxygen', 'Lithium'],
    c: 1,
    e: 'Hydrogen has atomic number 1.',
    context:
      'Hydrogen is the chemical element with the symbol H and atomic number 1. It is the lightest and most abundant element in the universe, making up about 75% of its elemental mass.',
  },
  {
    q: 'What is the capital of Germany?',
    a: ['Munich', 'Frankfurt', 'Berlin', 'Hamburg'],
    c: 2,
    e: 'Berlin is the capital of Germany.',
    context:
      'Berlin is the capital and largest city of Germany, located in the northeastern part of the country. It is known for its cultural heritage, modern architecture, and vibrant arts scene.',
  },
  {
    q: 'Which famous scientist formulated the laws of motion?',
    a: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Max Planck'],
    c: 1,
    e: 'Isaac Newton formulated the classical laws of motion.',
    context:
      'Isaac Newton was an English mathematician, physicist, and astronomer who is widely recognized for formulating the laws of motion and universal gravitation.',
  },
  {
    q: 'What is the main ingredient in hummus?',
    a: ['Lentils', 'Chickpeas', 'Beans', 'Peas'],
    c: 1,
    e: 'Hummus is made primarily from chickpeas.',
    context:
      'Hummus is a spread made from cooked, mashed chickpeas or other beans, and is a common part of Levantine and Middle Eastern cuisines. It is often served with pita bread.',
  },
  {
    q: 'What is the largest lake by area in Africa?',
    a: ['Lake Victoria', 'Lake Tanganyika', 'Lake Malawi', 'Lake Turkana'],
    c: 0,
    e: 'Lake Victoria is the largest lake in Africa by area.',
    context:
      'Lake Victoria is the largest lake in Africa and the second-largest freshwater lake in the world by surface area. It is bordered by three countries: Tanzania, Uganda, and Kenya.',
  },
  {
    q: 'Which composer wrote the opera La Traviata?',
    a: ['Wagner', 'Verdi', 'Puccini', 'Mozart'],
    c: 1,
    e: 'Giuseppe Verdi composed La Traviata.',
    context:
      'La Traviata is an opera in three acts by Giuseppe Verdi, premiered in 1853. It is based on the novel "La Dame aux Camélias" by Alexandre Dumas fils and is one of the most performed operas worldwide.',
  },
  {
    q: 'Which city is home to the Colosseum?',
    a: ['Athens', 'Rome', 'Istanbul', 'Naples'],
    c: 1,
    e: 'The Colosseum is located in Rome.',
    context:
      'The Colosseum, also known as the Flavian Amphitheatre, is an ancient oval amphitheatre located in the center of Rome. It is the largest amphitheatre ever built and is considered one of the greatest works of Roman architecture and engineering.',
  },
  {
    q: 'What is the capital of Spain?',
    a: ['Valencia', 'Seville', 'Madrid', 'Barcelona'],
    c: 2,
    e: 'Madrid is the capital of Spain.',
    context:
      'Madrid is the capital and largest city of Spain, located in the center of the country. It is known for its cultural and artistic heritage, as well as its vibrant nightlife.',
  },
  {
    q: 'Which planet has a day longer than its year?',
    a: ['Mercury', 'Venus', 'Mars', 'Earth'],
    c: 1,
    e: 'Venus rotates slowly so its day is longer than its year.',
    context:
      'Venus is the second planet from the Sun and has a very slow rotation on its axis, taking about 243 Earth days to complete one rotation. However, its orbit around the Sun takes only about 225 Earth days.',
  },
  {
    q: 'Who wrote "The Odyssey"?',
    a: ['Homer', 'Virgil', 'Sophocles', 'Plato'],
    c: 0,
    e: 'Homer is attributed as the author of The Odyssey.',
    context:
      'The Odyssey is an ancient Greek epic poem attributed to Homer. It is one of the two major ancient Greek epic poems, the other being the Iliad, and it consists of 24 books.',
  },
  {
    q: 'Which organ is primarily responsible for detoxifying chemicals?',
    a: ['Heart', 'Lung', 'Liver', 'Spleen'],
    c: 2,
    e: 'The liver detoxifies many chemicals in the body.',
    context:
      'The liver is a vital organ that plays a key role in metabolism, digestion, and detoxification. It filters blood coming from the digestive tract and detoxifies chemicals, metabolizes drugs, and secretes bile.',
  },
  {
    q: 'Which country is famous for maple syrup?',
    a: ['United States', 'Canada', 'Norway', 'Sweden'],
    c: 1,
    e: 'Canada is famous for maple syrup.',
    context:
      'Canada is the largest producer of maple syrup in the world, accounting for about 71% of the global market share. Maple syrup is a traditional Canadian sweetener made from the sap of sugar maple trees.',
  },
  {
    q: 'What is the common name for sodium bicarbonate?',
    a: ['Baking soda', 'Table salt', 'Vinegar', 'Baking powder'],
    c: 0,
    e: 'Sodium bicarbonate is known as baking soda.',
    context:
      'Sodium bicarbonate, commonly known as baking soda, is a chemical compound with the formula NaHCO₃. It is used in baking as a leavening agent, and also has various household and industrial uses.',
  },
  {
    q: 'Which sea creature has eight arms?',
    a: ['Shark', 'Octopus', 'Dolphin', 'Jellyfish'],
    c: 1,
    e: 'An octopus has eight arms.',
    context:
      'Octopuses are marine animals known for their eight arms, which are lined with sensitive suckers. They are intelligent creatures and can change color and texture to blend in with their surroundings.',
  },
  {
    q: 'What is the capital of Russia?',
    a: ['Saint Petersburg', 'Moscow', 'Novosibirsk', 'Sochi'],
    c: 1,
    e: 'Moscow is the capital of Russia.',
    context:
      'Moscow is the capital and largest city of Russia, located in the western part of the country. It is known for its rich cultural history, architecture, and as a major political, economic, and scientific center.',
  },
  {
    q: 'Which instrument is primarily used in jazz as a brass reed instrument?',
    a: ['Violin', 'Saxophone', 'Clarinet', 'Oboe'],
    c: 1,
    e: 'The saxophone is a common brass reed instrument in jazz.',
    context:
      'The saxophone is a musical instrument invented by Adolphe Sax in the 1840s. It is a key instrument in jazz music, known for its expressive range and timbre.',
  },
  {
    q: 'What is the largest planet in our solar system?',
    a: ['Earth', 'Saturn', 'Jupiter', 'Neptune'],
    c: 2,
    e: 'Jupiter is the largest planet in the solar system.',
    context:
      'Jupiter is the fifth planet from the Sun and is more than twice as massive as all the other planets in the solar system combined. It has a thick atmosphere made up mostly of hydrogen and helium.',
  },
  {
    q: 'Which chemical element is liquid and used in thermometers?',
    a: ['Mercury', 'Lead', 'Sodium', 'Iron'],
    c: 0,
    e: 'Mercury is used in some thermometers.',
    context:
      'Mercury is a chemical element with the symbol Hg and atomic number 80. It is a heavy, silvery-white liquid metal that is used in thermometers, barometers, and other scientific instruments.',
  },
  {
    q: 'Who is known as the father of modern physics and developed the laws of motion?',
    a: ['Benjamin Franklin', 'Isaac Newton', 'Albert Einstein', 'Nikola Tesla'],
    c: 1,
    e: 'Isaac Newton developed the laws of motion.',
    context:
      'Isaac Newton is often referred to as the father of modern physics for his groundbreaking work in the 17th century. He formulated the laws of motion and universal gravitation, laying the foundation for classical mechanics.',
  },
  {
    q: 'Which country is famous for the tango dance?',
    a: ['Brazil', 'Argentina', 'Mexico', 'Chile'],
    c: 1,
    e: 'Argentina is famous for the tango.',
    context:
      'The tango is a partner dance that originated in the 1880s along the River Plate, the natural border between Argentina and Uruguay. It is now popular worldwide and is known for its passionate and dramatic style.',
  },
  {
    q: 'What is the capital of South Africa (one of them)?',
    a: ['Cape Town', 'Pretoria', 'Johannesburg', 'Durban'],
    c: 1,
    e: "Pretoria is one of South Africa's capitals (administrative).",
    context:
      'South Africa has three capital cities: Pretoria (administrative), Cape Town (legislative), and Bloemfontein (judicial). Pretoria is known for its diplomatic missions and embassies.',
  },
  {
    q: 'Which substance is needed for combustion?',
    a: ['Oxygen', 'Helium', 'Nitrogen', 'Carbon dioxide'],
    c: 0,
    e: 'Oxygen supports combustion.',
    context:
      'Combustion is a chemical process that occurs when a substance reacts rapidly with oxygen and releases energy in the form of light and heat. Oxygen is essential for combustion to occur.',
  },
  {
    q: 'Who wrote the novel "Moby Dick"?',
    a: [
      'Herman Melville',
      'Ernest Hemingway',
      'F Scott Fitzgerald',
      'Mark Twain',
    ],
    c: 0,
    e: 'Herman Melville is the author of Moby Dick.',
    context:
      "Moby Dick is an 1851 novel by Herman Melville. The book is the sailor Ishmael's narrative of the obsessive quest of Ahab, captain of the whaling ship Pequod, for revenge on Moby Dick.",
  },
  {
    q: 'What is the primary material used to make glass?',
    a: ['Iron', 'Sand', 'Wood', 'Clay'],
    c: 1,
    e: 'Glass is primarily made from silica sand.',
    context:
      'Glass is a solid material that is typically made from silica (silicon dioxide) sand, soda ash, and limestone. It is used in windows, bottles, and many other applications.',
  },
  {
    q: 'Which famous tower leans and is in Italy?',
    a: ['Eiffel Tower', 'Leaning Tower of Pisa', 'Big Ben', 'CN Tower'],
    c: 1,
    e: 'The Leaning Tower of Pisa is in Italy.',
    context:
      'The Leaning Tower of Pisa is a freestanding bell tower located in Pisa, Italy. It is famous for its unintended tilt, which began during its construction in the 12th century.',
  },
  {
    q: 'Which organ controls the nervous system?',
    a: ['Heart', 'Brain', 'Liver', 'Kidney'],
    c: 1,
    e: 'The brain controls the nervous system.',
    context:
      'The brain is the central organ of the human nervous system, and with the spinal cord, it makes up the central nervous system (CNS). It is responsible for processing sensory information and coordinating bodily functions.',
  },
  {
    q: 'What is the capital of Turkey?',
    a: ['Istanbul', 'Ankara', 'Izmir', 'Bursa'],
    c: 1,
    e: 'Ankara is the capital of Turkey.',
    context:
      'Ankara is the capital of Turkey, located in the central part of the country. It became the capital in 1923, replacing Istanbul as the capital of the Republic of Turkey.',
  },
  {
    q: 'Which sport is played at Wimbledon?',
    a: ['Cricket', 'Tennis', 'Football', 'Rugby'],
    c: 1,
    e: 'Wimbledon is a major tennis tournament.',
    context:
      'The Wimbledon Championships is the oldest tennis tournament in the world, and is considered the most prestigious. It has been held at the All England Club in Wimbledon, London, since 1877.',
  },
  {
    q: 'What metal is primarily used to make aircraft bodies due to its light weight?',
    a: ['Steel', 'Titanium', 'Aluminum', 'Copper'],
    c: 2,
    e: 'Aluminum is widely used for aircraft bodies.',
    context:
      'Aluminum is a lightweight, durable metal that is resistant to corrosion, making it ideal for aircraft construction. It is used in the manufacture of aircraft bodies, wings, and other components.',
  },
  {
    q: 'Which ocean is between Africa and Australia?',
    a: ['Atlantic', 'Pacific', 'Indian', 'Arctic'],
    c: 2,
    e: 'The Indian Ocean lies between Africa and Australia.',
    context:
      "The Indian Ocean is the third-largest ocean, covering about 20% of the Earth's water surface. It is bounded by Africa, Asia, Australia, and the Indian subcontinent.",
  },
];
