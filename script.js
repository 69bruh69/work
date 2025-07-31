document.addEventListener('DOMContentLoaded', () => {

    // Nutritionix credentials (from user's script.js)
    const NIX_APP_ID = '8a9e5a41';
    const NIX_APP_KEY = '4ba53a36f724dfb47307baaf0528ff2c';

    // Helper functions (from user's script.js)
    const qs = s => document.querySelector(s);
    const qsa = s => document.querySelectorAll(s);
    const todayKey = () => new Date().toLocaleDateString();
    const weekKeys = () => [...Array(7).keys()]
        .map(i => { const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString(); })
        .reverse();

    // Custom message box function to replace alert()
    function showMessage(message, type = 'error') {
        const msgBox = qs('#message-box');
        msgBox.textContent = message;
        msgBox.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50'; // Red for error, Green for success
        msgBox.style.display = 'block';
        setTimeout(() => {
            msgBox.style.display = 'none';
        }, 4000); // Hide after 4 seconds
    }

    // LLM Modal elements
    const llmResponseModal = qs('#llm-response-modal');
    const closeModalButton = qs('.close-button');
    const modalTitle = qs('#modal-title');
    const modalLoadingSpinner = qs('#modal-loading-spinner');
    const modalResponseContent = qs('#modal-response-content');

    // Function to open LLM modal
    function openLlmModal(title, content = '', isLoading = false) {
        modalTitle.textContent = title;
        modalResponseContent.innerHTML = content;
        if (isLoading) {
            modalLoadingSpinner.style.display = 'block';
            modalResponseContent.style.display = 'none';
        } else {
            modalLoadingSpinner.style.display = 'none';
            modalResponseContent.style.display = 'block';
        }
        llmResponseModal.style.display = 'flex';
    }

    // Function to close LLM modal
    closeModalButton.addEventListener('click', () => {
        llmResponseModal.style.display = 'none';
    });

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target == llmResponseModal) {
            llmResponseModal.style.display = 'none';
        }
    });

    // Gemini API Call Helper with Exponential Backoff
    async function callGeminiApi(prompt, retries = 3, delay = 1000) {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will automatically provide this
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.candidates && result.candidates.length > 0 &&
                        result.candidates[0].content && result.candidates[0].content.parts &&
                        result.candidates[0].content.parts.length > 0) {
                        return result.candidates[0].content.parts[0].text;
                    } else {
                        throw new Error("Unexpected API response structure.");
                    }
                } else if (response.status === 429 && i < retries - 1) { // Too Many Requests
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                if (i === retries - 1) {
                    console.error("Gemini API call failed after retries:", error);
                    throw error;
                }
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            }
        }
        throw new Error("Gemini API call failed after multiple retries.");
    }


    // GIF pool (from user's script.js)
    const cuteData = [
        { src: 'https://media1.tenor.com/m/JaPNKCpIOZcAAAAd/kirby-music.gif', txt: 'kirby dancing' },
        { src: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/098bda0f-65f2-413d-a532-67d6ab544e6e/dcdswz2-047854c6-dac8-40c8-8166-abbbd7da5d8d.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzA5OGJkYTBmLTY1ZjItNDEzZC1hNTMyLTY3ZDZhYjU0NGU2ZVwvZGNkc3d6Mi0wNDc4NTRjNi1kYWM4LTQwYzgtODE2Ni1hYmJiZDdkYTVkOGQuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0._SULvSq-HBbY9nwphhFX-f1OIaf2Ki85L7C_i4bTWww', txt: 'die… die… die…' },
        { src: 'https://64.media.tumblr.com/7cc34a7045ffc2686b2df78c6449166e/tumblr_inline_nr8zb0bytS1txlwvy_500.gifv', txt: 'morgan fuel' },
        { src: 'https://media1.tenor.com/m/siv8RN65L6YAAAAd/creepy-creepy-dog.gif', txt: '̴d̴o̴ ̴n̴o̴t̴ ̴f̴e̴e̴d̴ ̴t̴h̴e̴ ̴b̴e̴a̴s̴t̴' },
        { src: 'https://media1.tenor.com/m/kAriIc-su6UAAAAd/fnaf-springbonnie-springtrap-i-will-find-you.gif', txt: 'I  w i l l  f i n d  y o u' },
        { src: 'https://media1.tenor.com/m/YlKhK9ftJwkAAAAC/horror.gif', txt: 'the night watches back 🌑' },
        { src: 'https://media1.tenor.com/m/Y2pC-Tdw4bAAAAAC/averageanatomy-tonio.gif', txt: 'ƈơռʄʀօռȶ ȶհɛ ǟɮʏss' },
        { src: 'https://media.tenor.com/I1h__HGeudcAAAAi/mad-trollge.gif', txt: 'mango mango mango' }
    ];

    function setCute() {
        const pick = cuteData[Math.floor(Math.random() * cuteData.length)];
        qs('#cute-img').src = pick.src;
        qs('#cute-quote').textContent = pick.txt;
    }
    setCute(); // Set initial cute GIF
    qs('#cute-refresh').addEventListener('click', setCute); // Add event listener for refresh


    const allWorkoutPlans = {
        'ppl': {
            name: 'PPL HYPERTROPHY',
            days: [
                { id: '1', name: 'Day 1: Push', type: 'training' },
                { id: '2', name: 'Day 2: Pull', type: 'training' },
                { id: '3', name: 'Day 3: Legs', type: 'training' },
                { id: '4', name: 'Day 4: Push', type: 'training' },
                { id: '5', name: 'Day 5: Pull', type: 'training' },
                { id: '6', name: 'Day 6: Legs', type: 'training' },
                { id: '7', name: 'Day 7: Rest', type: 'rest' }
            ],
            data: {
                '1': {
                    title: 'Day 1: Push (Bench Focus) - Let\'s Get Pressing!',
                    description: 'Time to build that chest, shoulders, and triceps! We\'re hitting those pushing muscles hard, with a special focus on getting your bench press numbers up. Get ready to feel strong!',
                    warmup: [
                        '5-10 minutes light cardio (like elliptical or bike) to get that blood pumping and warm up your engine.',
                        'Dynamic stretches: Big arm circles (forward and backward), shoulder rotations, and some band pull-aparts to get your shoulders ready to rock.',
                        '2-3 warm-up sets of Barbell Bench Press: Start with just the bar, then add a super light weight, gradually building up to your working weight. Focus on perfect form, every single rep!'
                    ],
                    exercises: [
                        { 
                            name: 'Barbell Bench Press', 
                            purpose: 'This is your main event for chest size and raw strength. It blasts your pecs, front shoulders, and triceps.', 
                            sets: '4–5', reps: '6–12', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Pull your shoulder blades back and down (imagine tucking them into your back pockets) to create a super stable base.',
                                'Keep a slight arch in your lower back, feet glued to the floor for max power.',
                                'Lower the bar slowly and with control to your mid-chest, right below your nipples.',
                                'Drive the bar up explosively, keeping your elbows tucked in a bit (around 45-60 degrees from your body).'
                            ],
                            commonMistakes: [
                                'Flaring elbows out too wide (hello, shoulder pain!).',
                                'Bouncing the bar off your chest (that\'s cheating and dangerous!).',
                                'Not using your legs for drive (you\'re missing out on serious power!).',
                                'Lifting your butt off the bench (kills stability, strains your lower back).'
                            ]
                        },
                        { 
                            name: 'Incline Dumbbell Press', 
                            purpose: 'Time to sculpt that upper chest! This is key for a full, aesthetic chest. It\'ll hit your upper pecs and front delts.', 
                            sets: '3–4', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Set the bench to a 30-45 degree angle. Too steep, and you\'re just doing a shoulder press.',
                                'Keep those dumbbells controlled; don\'t let them crash together at the top.',
                                'Really squeeze your upper chest at the very top of the movement.'
                            ],
                            commonMistakes: [
                                'Going too heavy and losing control (you\'ll look like a flailing fish!).',
                                'Arching your back too much, turning it into a flat press.',
                                'Not getting a full stretch at the bottom (leave those gains on the table!).'
                            ]
                        },
                        { 
                            name: 'Overhead Dumbbell Press', 
                            purpose: 'Get those boulder shoulders! This builds serious shoulder size and strength, hitting your front and side deltoids.', 
                            sets: '3', reps: '10–15', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Keep your core super tight to avoid arching your lower back like a rainbow.',
                                'Press those dumbbells straight overhead; don\'t lean back too much.',
                                'Lower them slowly and with control back to shoulder level.'
                            ],
                            commonMistakes: [
                                'Using too much momentum or leg drive (if standing).',
                                'Flaring elbows out excessively (ouch, shoulders!).',
                                'Not going through a full range of motion (half reps = half gains!).'
                            ]
                        },
                        { 
                            name: 'Skull Crushers (EZ Bar)', 
                            purpose: 'Time to pump up those triceps! This move isolates your triceps, especially the long head, for serious arm size.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Lie on a flat bench, hold an EZ bar with an overhand grip, arms straight up.',
                                'Lower the bar towards your forehead (or slightly behind it) by ONLY bending your elbows.',
                                'Keep your upper arms locked in place – no wiggling!',
                                'Explode back up, squeezing those triceps hard at the top.'
                            ],
                            commonMistakes: [
                                'Moving your elbows forward and back (you\'re doing a close-grip bench, not a skull crusher!).',
                                'Using too much weight and sacrificing good form.',
                                'Not getting a full stretch at the bottom (missed opportunity!).'
                            ]
                        },
                        { 
                            name: 'Lateral Raises', 
                            purpose: 'Want wider shoulders? This is your go-to! It targets the side deltoids for that awesome "cannonball" look.', 
                            sets: '3', reps: '12–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Stand with a slight bend in your elbows, dumbbells at your sides.',
                                'Raise dumbbells straight out to the sides until your arms are parallel to the floor (or slightly above), leading with your elbows.',
                                'Control the lowering phase super slowly.',
                                'Avoid shrugging your shoulders; focus on feeling it in your deltoids, not your traps.'
                            ],
                            commonMistakes: [
                                'Using momentum to swing the weights up (no cheating!).',
                                'Going too heavy and turning it into a shoulder press.',
                                'Shrugging your traps instead of isolating your delts (don\'t let your traps steal the show!).'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio (like a chill walk or bike ride) to cool down and help with blood flow.',
                        'Static stretches: Chest stretch (use a doorway!), triceps stretch (reach overhead), shoulder stretch (cross-body stretch). Hold each for 20-30 seconds, just a gentle pull, no pain!'
                    ]
                },
                '2': {
                    title: 'Day 2: Pull (Chin-Up Focus) - Time to Grow That Back!',
                    description: 'Today\'s all about building a thick, wide back and some serious biceps. We\'re pushing for progress on those Chin-Ups – get ready to pull your own weight!',
                    warmup: [
                        '5-10 minutes light cardio to get warm and ready.',
                        'Dynamic stretches: Arm swings, band pull-aparts (to wake up your upper back), and some cat-cow stretches for spinal mobility.',
                        '2-3 warm-up sets of Lat Pulldowns or assisted Chin-Ups to get those pulling muscles fired up.'
                    ],
                    exercises: [
                        { 
                            name: 'Chin-Up (Weighted if you\'re a beast!)', 
                            purpose: 'This is your golden ticket for back width and bicep strength. It hits your lats, biceps, and upper back like crazy.', 
                            sets: '4–5', reps: '6–12', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Use an underhand grip, slightly narrower than shoulder-width.',
                                'Start the pull by squeezing your shoulder blades together and down.',
                                'Pull yourself up until your chin clears the bar, focusing on pulling with your elbows, not just your arms.',
                                'Lower yourself slowly and with control, getting a full stretch at the bottom.'
                            ],
                            commonMistakes: [
                                'Using momentum or kipping (unless you\'re specifically training for CrossFit, stick to strict!).',
                                'Not going through a full range of motion (half reps = half gains!).',
                                'Shrugging your shoulders up instead of pulling with your back (don\'t let your traps do all the work!).'
                            ]
                        },
                        { 
                            name: 'Seated Cable Row', 
                            purpose: 'Time to build that back thickness and hit your mid-back. This targets your rhomboids, traps, and lats.', 
                            sets: '4–5', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Keep your back straight and chest up, with a slight lean forward at the start.',
                                'Pull the handle towards your lower abs, squeezing your shoulder blades together like you\'re holding a pencil between them.',
                                'Control the eccentric phase, letting your shoulder blades stretch forward a bit for a good stretch.'
                            ],
                            commonMistakes: [
                                'Rounding your back (hello, lower back pain!).',
                                'Using too much momentum to swing the weight.',
                                'Not getting a full stretch or contraction (feel that squeeze!).'
                            ]
                        },
                        { 
                            name: 'Lat Pulldown', 
                            purpose: 'This one\'s all about lat width! It mimics a pull-up but gives you more control to really isolate those lats.', 
                            sets: '4', reps: '10–15', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Use a wide, overhand grip. Lock your thighs under the pads.',
                                'Lean back slightly (10-20 degrees) and pull the bar down to your upper chest, squeezing those lats like crazy.',
                                'Focus on driving your elbows down and back.',
                                'Control the bar on the way up, letting your lats get a full stretch.'
                            ],
                            commonMistakes: [
                                'Pulling too much with your biceps instead of your back.',
                                'Leaning back too far or swinging the weight (no dancing!).',
                                'Not getting a full stretch at the top (don\'t cheat yourself!).'
                            ]
                        },
                        { 
                            name: 'Lying Biceps Curl (EZ Bar)', 
                            purpose: 'Time to get those bicep peaks poppin\'! This targets both heads of your biceps for maximum arm size.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Lie on an incline bench with an EZ bar. Let your arms hang straight down for a deep, delicious stretch.',
                                'Curl the bar up, keeping your elbows locked in place and tucked in.',
                                'Squeeze your biceps hard at the top of the movement.',
                                'Control the lowering phase super slowly.'
                            ],
                            commonMistakes: [
                                'Using momentum or swinging the bar up (no swinging!).',
                                'Not getting a full stretch at the bottom.',
                                'Letting elbows flare out too wide (keep \'em tucked!).'
                            ]
                        },
                        { 
                            name: 'Forearm Curl', 
                            purpose: 'Don\'t skip these! Strong forearms mean a stronger grip, which helps with all your pulling movements. Plus, they look cool!', 
                            sets: '3', reps: '12–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Sit on a bench, rest your forearms on your thighs with your wrists hanging off your knees, palms up.',
                                'Let the bar roll down to your fingertips, then curl it back up using ONLY your wrists.',
                                'Keep the movement slow and controlled – no jerking!'
                            ],
                            commonMistakes: [
                                'Using too much weight and involving your biceps (this is for forearms!).',
                                'Not getting a full range of motion in the wrist.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Lat stretch (hang from a bar or stretch against a wall), bicep stretch (straighten arm, palm up, gently pull fingers back), forearm stretch. Hold \'em for 20-30 seconds each.'
                    ]
                },
                '3': {
                    title: 'Day 3: Legs (Squat Focus) - Build Those Tree Trunks!',
                    description: 'Today\'s all about building a powerful lower body – quads, hamstrings, and glutes. Your main mission: get stronger on those heavy Squats. Let\'s make those legs burn!',
                    warmup: [
                        '5-10 minutes light cardio (like a rower or stair climber) to get your core temperature up.',
                        'Dynamic stretches: Leg swings (forward/backward, side-to-side), bodyweight squats, walking lunges, and hip circles to get those hips and knees mobile.',
                        '2-3 warm-up sets of Barbell Squats: Start with just the bar, then add light weight, gradually increasing to your working weight. Focus on perfect depth and form, every single time!'
                    ],
                    exercises: [
                        { 
                            name: 'Barbell Squat', 
                            purpose: 'The king of all leg exercises! This builds overall leg and glute size, strength, and core stability. It hits your quads, hamstrings, glutes, and even your lower back.', 
                            sets: '3–4', reps: '6–10', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Place the bar comfortably on your upper back (high bar) or slightly lower (low bar), grip wide enough for comfort.',
                                'Feet shoulder-width apart, toes slightly out. Start by bending at your hips and knees at the same time.',
                                'Go deep! Descend until your hips are below your knees (or as deep as your mobility allows while keeping good form).',
                                'Keep your chest up, core super tight, and knees tracking over your toes.',
                                'Drive up through your heels, squeezing your glutes hard at the top.'
                            ],
                            commonMistakes: [
                                'Rounding your lower back (the dreaded "butt wink").',
                                'Knees caving in (valgus collapse – fix this!).',
                                'Not going deep enough (half squats = half gains!).',
                                'Lifting your heels off the ground.'
                            ]
                        },
                        { 
                            name: 'Romanian Deadlift (RDL)', 
                            purpose: 'This is your go-to for building serious hamstring and glute size, really emphasizing that stretch under load. Amazing for your whole posterior chain!', 
                            sets: '2–3', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Start with the bar at hip height. Keep a slight bend in your knees throughout the entire movement.',
                                'Hinge at your hips, pushing your butt way back as the bar slides down your thighs.',
                                'Keep the bar super close to your legs. You should feel a deep stretch in your hamstrings.',
                                'Stop when you feel that strong stretch or just before your lower back starts to round.',
                                'Drive your hips forward to return to the start, squeezing those glutes hard!'
                            ],
                            commonMistakes: [
                                'Rounding your back (major injury risk!). Keep that back flat like a board.',
                                'Bending your knees too much (you\'re doing a regular deadlift, not an RDL!).',
                                'Not keeping the bar close to your body (it\'ll drift away and strain your back).',
                                'Going too deep and losing tension in your hamstrings.'
                            ]
                        },
                        { 
                            name: 'Leg Extension', 
                            purpose: 'Time to isolate those quads for definition and serious hypertrophy. Get that "quad sweep" looking good!', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: '0–2',
                            formTips: [
                                'Sit with your knees at a 90-degree angle, pad resting on your shins just above your ankles.',
                                'Extend your legs fully, squeezing your quads super hard at the top – imagine flexing for a photo!',
                                'Control the eccentric phase slowly, resisting the weight on the way down.'
                            ],
                            commonMistakes: [
                                'Using momentum to kick the weight up (no swinging!).',
                                'Not getting a full contraction at the top.',
                                'Allowing your hips to lift off the seat (stay glued!).'
                            ]
                        },
                        { 
                            name: 'Hamstring Curl (Seated or Lying)', 
                            purpose: 'This isolates your hamstrings for strength and size. Crucial for balanced leg development and preventing imbalances.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: '0–2',
                            formTips: [
                                'Position yourself so the pad is on your lower calves/Achilles tendon.',
                                'Curl the weight up, focusing on squeezing your hamstrings hard.',
                                'Control the weight on the way down, resisting the pull.',
                                'Avoid lifting your hips off the pad (if lying) or using your lower back.'
                            ],
                            commonMistakes: [
                                'Using too much weight and arching your back.',
                                'Not getting a full contraction at the top.',
                                'Rushing the movement, especially the eccentric (slow and controlled!).'
                            ]
                        },
                        { 
                            name: 'Standing Calf Raise', 
                            purpose: 'Don\'t neglect those calves! This develops your gastrocnemius (the bigger calf muscle) for size and power. Get ready for some serious pumps!', 
                            sets: '3', reps: '12–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Stand with the balls of your feet on a raised platform, heels hanging off.',
                                'Lower your heels to get a deep, deep stretch in your calves.',
                                'Raise up as high as humanly possible onto the balls of your feet, squeezing your calves hard at the peak.',
                                'Control the descent slowly – feel that stretch!'
                            ],
                            commonMistakes: [
                                'Not getting a full stretch at the bottom or full contraction at the top (full range of motion is key!).',
                                'Bouncing the weight up and down (no cheating!).',
                                'Using too much weight and sacrificing range of motion.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Quad stretch (standing or lying), hamstring stretch (seated or standing), glute stretch (figure-four stretch), calf stretch (against a wall). Hold each for 20-30 seconds.'
                    ]
                },
                '4': {
                    title: 'Day 4: Push (Overhead Press Focus) - Shoulder Day, Best Day!',
                    description: 'Today\'s all about building those caps and getting your pressing strength up, with some extra love for your chest and triceps. Your mission: crush that Overhead Press!',
                    warmup: [
                        '5-10 minutes light cardio to get warm.',
                        'Dynamic stretches: Arm circles, band pull-aparts, and wall slides to get those shoulders mobile and ready.',
                        '2-3 warm-up sets of Overhead Press with light weight, focusing on nailing that movement pattern.'
                    ],
                    exercises: [
                        { 
                            name: 'Barbell Overhead Press', 
                            purpose: 'This is your primary move for shoulder mass and strength. It hits all three heads of your deltoids and your triceps.', 
                            sets: '4–5', reps: '6–10', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Stand with feet shoulder-width apart, core tight, and a slight bend in your knees for stability.',
                                'Grip the bar slightly wider than shoulder-width, rack it on your upper chest/front delts.',
                                'Press the bar directly overhead, pushing your head slightly forward once the bar clears it.',
                                'Lower the bar with control back to the starting position.'
                            ],
                            commonMistakes: [
                                'Arching your lower back too much (don\'t turn into a banana!).',
                                'Not pressing in a straight line (the bar path should be smooth).',
                                'Shrugging your shoulders too much (letting your traps take over).'
                            ]
                        },
                        { 
                            name: 'Dips (Weighted if you\'re a beast!)', 
                            purpose: 'An awesome compound movement that blasts your lower chest and triceps. Get ready to feel strong!', 
                            sets: '4–5', reps: 'AMRAP', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Lean slightly forward to hit your chest more, stay more upright to focus on triceps.',
                                'Lower until your shoulders are below your elbows (or as deep as comfortable without pain).',
                                'Drive up powerfully, squeezing your chest/triceps at the top.'
                            ],
                            commonMistakes: [
                                'Not going deep enough (full range of motion!).',
                                'Flaring elbows out excessively (can strain shoulders – keep \'em tucked!).',
                                'Using too much momentum (no swinging!).'
                            ]
                        },
                        { 
                            name: 'Dumbbell Chest Fly', 
                            purpose: 'This isolates your chest for a deep stretch and strong contraction, really hitting that inner chest area.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Lie on a flat bench, dumbbells held above your chest with a slight bend in your elbows.',
                                'Lower the dumbbells out to the sides in a wide arc, feeling a deep stretch in your chest.',
                                'Bring them back up in the same arc, squeezing your chest hard at the top.',
                                'Maintain that slight bend in your elbows throughout the movement.'
                            ],
                            commonMistakes: [
                                'Bending elbows too much (you\'re doing a press, not a fly!).',
                                'Using too much weight and losing control (slow and steady wins the race!).',
                                'Not getting a full stretch or contraction.'
                            ]
                        },
                        { 
                            name: 'Overhead Triceps Extension', 
                            purpose: 'This one targets the long head of your triceps, which is crucial for overall arm size and that full triceps look.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Sit or stand, hold a dumbbell with both hands (or an EZ bar) behind your head, elbows pointing forward.',
                                'Extend your arms overhead, squeezing those triceps hard.',
                                'Lower the weight slowly and with control, feeling a stretch in your triceps.',
                                'Keep those elbows tucked in and stationary – no flaring!'
                            ],
                            commonMistakes: [
                                'Flaring elbows out (keep \'em tight!).',
                                'Using too much weight and arching your back excessively.',
                                'Not getting a full range of motion.'
                            ]
                        },
                        { 
                            name: 'Lateral Raises', 
                            purpose: 'Wanna build those wide, round shoulders? This is your secret weapon! It targets the side deltoids for that awesome "cannonball" look.', 
                            sets: '3', reps: '12–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Stand with a slight bend in your elbows, dumbbells at your sides.',
                                'Raise dumbbells straight out to the sides until your arms are parallel to the floor (or slightly above), leading with your elbows.',
                                'Control the lowering phase super slowly.',
                                'Avoid shrugging your shoulders; focus on feeling it in your deltoids, not your traps.'
                            ],
                            commonMistakes: [
                                'Using momentum to swing the weights up (no cheating!).',
                                'Going too heavy and turning it into a shoulder press.',
                                'Shrugging your traps instead of isolating your delts (don\'t let your traps steal the show!).'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Shoulder stretch, triceps stretch, chest stretch. Hold \'em for 20-30 seconds each.'
                    ]
                },
                '5': {
                    title: 'Day 5: Pull (Pull-Up Focus) - Back Attack!',
                    description: 'Time to build that thick, wide back and emphasize your lats and upper back. Your main goal: get stronger on those Pull-Ups! Let\'s go!',
                    warmup: [
                        '5-10 minutes light cardio to get warm.',
                        'Dynamic stretches: Arm swings, band pull-aparts, and scapular retractions to get those back muscles fired up.',
                        '2-3 warm-up sets of Pull-Ups or assisted Pull-Ups to prime the muscles.'
                    ],
                    exercises: [
                        { 
                            name: 'Pull-Up (Weighted if you\'re a pro!)', 
                            purpose: 'The ultimate move for back width and overall pulling strength. It hits your lats, biceps, and upper back like a boss!', 
                            sets: '4–5', reps: 'AMRAP', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Use an overhand grip, slightly wider than shoulder-width.',
                                'Initiate the pull by squeezing your shoulder blades together and down.',
                                'Pull yourself up until your chin clears the bar, focusing on pulling with your elbows, not just your arms.',
                                'Lower yourself slowly and with control, getting a full stretch at the bottom.'
                            ],
                            commonMistakes: [
                                'Using momentum or kipping (unless you\'re specifically training for it, stick to strict!).',
                                'Not going through a full range of motion (half reps = half gains!).',
                                'Shrugging your shoulders up instead of pulling with your back (don\'t let your traps take over!).'
                            ]
                        },
                        { 
                            name: 'T-Bar Row', 
                            purpose: 'This builds serious back thickness and density, targeting your middle and upper back. Get ready for that cobra look!', 
                            sets: '4–5', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Use a neutral grip handle. Keep your chest supported (if using a machine) or maintain a strong hinge at the hips (if free weight).',
                                'Pull the weight up towards your chest/abdomen, squeezing your shoulder blades together like you\'re trying to crack a nut.',
                                'Control the eccentric phase, letting your lats and upper back get a good stretch.'
                            ],
                            commonMistakes: [
                                'Rounding your back (major injury risk!). Keep it flat and strong.',
                                'Using too much momentum to swing the weight.',
                                'Not getting a full stretch or contraction (feel that squeeze!).'
                            ]
                        },
                        { 
                            name: 'Dumbbell Pullover', 
                            purpose: 'This one stretches and works your lats for width, and also hits your chest and serratus anterior. Great for overall upper body development!', 
                            sets: '3', reps: '10–15', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Lie perpendicular to a bench, upper back supported, feet flat. Hold one dumbbell with both hands above your chest.',
                                'Lower the dumbbell slowly behind your head in a wide arc, feeling a deep stretch in your lats and chest.',
                                'Pull the dumbbell back over your chest using your lats.',
                                'Keep a slight bend in your elbows throughout.'
                            ],
                            commonMistakes: [
                                'Using too much weight and arching your back excessively.',
                                'Bending elbows too much (you\'re doing a triceps extension, not a pullover!).',
                                'Not getting a full stretch.'
                            ]
                        },
                        { 
                            name: 'Dumbbell Biceps Curl', 
                            purpose: 'Classic bicep builder! This allows you to work each arm individually for balanced development and maximum pump.', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Stand or sit, hold dumbbells with palms facing forward.',
                                'Curl the dumbbells up, keeping elbows tucked and stationary.',
                                'Squeeze your biceps hard at the top, then control the descent.',
                                'Avoid swinging or using momentum (no cheating!).'
                            ],
                            commonMistakes: [
                                'Swinging the weights up (no momentum!).',
                                'Flaring elbows out (keep \'em tucked!).',
                                'Not getting a full stretch at the bottom.'
                            ]
                        },
                        { 
                            name: 'Hammer Curl', 
                            purpose: 'This targets your brachialis and brachioradialis, which are key for overall arm thickness and forearm development. Get those arms looking beefy!', 
                            sets: '3', reps: '10–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Hold dumbbells with a neutral grip (palms facing each other).',
                                'Curl the dumbbells up, keeping elbows tucked and stationary.',
                                'Focus on the contraction in your forearms and outer biceps.',
                                'Control the descent.'
                            ],
                            commonMistakes: [
                                'Swinging the weights up (no cheating!).',
                                'Flaring elbows out (keep \'em tucked!).',
                                'Not getting a full stretch at the bottom.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Lat stretch, bicep stretch, upper back stretch. Hold \'em for 20-30 seconds each.'
                    ]
                },
                '6': {
                    title: 'Day 6: Legs (Deadlift Focus) - Pull for Power!',
                    description: 'Today\'s all about building that posterior chain strength and overall power, with a heavy focus on your hamstrings, glutes, and lower back. Your main goal: get stronger on those Deadlift. This is where you build serious power!',
                    warmup: [
                        '5-10 minutes light cardio (like a rower or bike) to get warm.',
                        'Dynamic stretches: Leg swings, glute bridges, and bodyweight good mornings to activate that posterior chain.',
                        '2-3 warm-up sets of Deadlifts: Start with just the bar, then add light weight, gradually increasing to your working weight. Focus on that perfect hip hinge!'
                    ],
                    exercises: [
                        { 
                            name: 'Deadlift', 
                            purpose: 'The ultimate full-body strength builder! This blasts your hamstrings, glutes, lower back, and grip strength. Get ready to feel like a powerhouse!', 
                            sets: '3–5', reps: '6–12', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Stand with feet hip-width apart, bar over mid-foot. Hinge at your hips, grab the bar with a mixed or overhand grip.',
                                'Keep your back straight, chest up, shoulders pulled back. Start by driving through your heels, lifting your chest and hips at the same time.',
                                'Pull the bar in a straight line up your shins, squeezing your glutes hard at the top (don\'t hyperextend!).',
                                'Lower with control, reversing the motion by hinging at your hips first.'
                            ],
                            commonMistakes: [
                                'Rounding your back (MAJOR injury risk!). Keep that back flat!',
                                'Squatting the weight up (hips dropping too low).',
                                'Not keeping the bar close to your body (it\'ll drift away and strain your back).',
                                'Jerking the weight off the floor (smooth and controlled!).'
                            ]
                        },
                        { 
                            name: 'Leg Press', 
                            purpose: 'Targets your quads and glutes with less stress on your spine than squats. Great for high volume and really burning out those legs!', 
                            sets: '3–5', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Place feet shoulder-width apart on the platform, toes slightly out. Lower the platform until your knees are near your chest (or as deep as comfortable without your lower back rounding).',
                                'Drive through your heels, extending your legs, but don\'t lock out your knees at the top – keep tension!',
                                'Control the eccentric phase slowly.'
                            ],
                            commonMistakes: [
                                'Rounding your lower back at the bottom.',
                                'Locking out knees at the top (bad for your joints!).',
                                'Feet too high or too low on the platform (changes what muscles you hit).'
                            ]
                        },
                        { 
                            name: 'Back Extensions (Hyperextensions)', 
                            purpose: 'Strengthens your lower back, glutes, and hamstrings. Awesome for overall posterior chain health and power.', 
                            sets: '3', reps: '10–15', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Anchor your feet, hips at the edge of the pad. Keep your back straight and strong.',
                                'Lower your torso until you feel a stretch in your hamstrings/glutes.',
                                'Extend back up, squeezing your glutes hard at the top. Avoid hyperextending your lower back.'
                            ],
                            commonMistakes: [
                                'Rounding your back (keep it straight!).',
                                'Hyperextending at the top (arching too much).',
                                'Using momentum to swing up.'
                            ]
                        },
                        { 
                            name: 'Reverse Crunches', 
                            purpose: 'Time to hit those lower abs and build overall core strength. A strong core supports all your big lifts!', 
                            sets: '3', reps: 'AMRAP', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Lie on your back, hands by your sides or under your lower back. Legs bent at 90 degrees.',
                                'Lift your hips off the floor, bringing your knees towards your chest, squeezing your lower abs.',
                                'Control the descent slowly – don\'t let your feet crash down!'
                            ],
                            commonMistakes: [
                                'Using momentum to swing legs up.',
                                'Not lifting hips off the floor (you need that crunch!).',
                                'Straining your neck.'
                            ]
                        },
                        { 
                            name: 'Seated Calf Raise', 
                            purpose: 'This targets the soleus muscle (the deeper calf muscle) for overall calf development and thickness. Get those calves looking solid!', 
                            sets: '3', reps: '12–15', rest: '1 min', rir: 'Failure on last set',
                            formTips: [
                                'Sit on the machine, balls of your feet on the platform, knees bent.',
                                'Lower your heels to get a deep stretch, then push up as high as possible.',
                                'Squeeze the calves hard at the peak, control the descent.'
                            ],
                            commonMistakes: [
                                'Not getting a full range of motion.',
                                'Bouncing the weight.',
                                'Using too much weight and sacrificing form.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Hamstring stretch, glute stretch, hip flexor stretch, lower back stretch, calf stretch. Hold \'em for 20-30 seconds each.'
                    ]
                },
                '7': {
                    title: 'Day 7: Rest & Recover - You Earned It!',
                    description: 'This is your dedicated rest day. No heavy lifting, no intense cardio. Remember, your muscles grow and repair when you rest, not just when you\'re in the gym. Focus on quality sleep, nutritious food, and staying hydrated. Don\'t skip it – it\'s crucial for your progress!',
                    warmup: [],
                    exercises: [],
                    cooldown: []
                }
            }
        },
        'womenLowerBody': {
            name: 'ULTIMATE LOWER BODY (Women)',
            days: [
                { id: '1', name: 'Mon: Glute & Ham Focus', type: 'training' },
                { id: '2', name: 'Tue: Upper Body & Core', type: 'training' },
                { id: '3', name: 'Wed: Quad & Glute Focus', type: 'training' },
                { id: '4', name: 'Thu: Lower Body (Accessory)', type: 'training' },
                { id: '5', name: 'Fri: Upper Body & Core', type: 'training' },
                { id: '6', name: 'Sat: Full Lower Body (Volume)', type: 'training' },
                { id: '7', name: 'Sun: Rest', type: 'rest' }
            ],
            data: {
                '1': {
                    title: 'Monday: Glute & Hamstring Focus (Heavy) - Booty & Hammy Blast!',
                    description: 'Alright ladies, this day is all about absolutely smashing those glutes and hamstrings to build that powerful posterior chain. We\'re going heavy, so focus on feeling that stretch and contraction!',
                    warmup: [
                        '5-10 minutes light cardio (like the stair climber or elliptical) to get your blood flowing and muscles warm.',
                        'Dynamic stretches: Leg swings (forward/backward, side-to-side), hip circles, and some cat-cow stretches to get everything moving.',
                        'Glute Activation (5-10 minutes): Seriously, don\'t skip this! Do Banded Glute Bridges (2 sets of 15-20 reps), Banded Clamshells (2 sets of 15-20 reps per side), and Banded Lateral Walks (2 sets of 10 steps each way). Get those glutes firing!'
                    ],
                    exercises: [
                        { 
                            name: 'Barbell Hip Thrust', 
                            purpose: 'This is THE queen of glute exercises for maximum size and strength. It directly targets your gluteus maximus like nothing else!', 
                            sets: '4', reps: '8–12', rest: '2-3 min', rir: '0–1',
                            formTips: [
                                'Sit on the floor with your upper back against a bench, barbell over your hips (use a thick pad, please!).',
                                'Feet flat on the floor, about shoulder-width apart, knees bent, shins vertical at the top of the movement.',
                                'Drive through your heels, squeezing your glutes so hard at the top that you could crack a walnut! Lift your hips until your body forms a straight line from shoulders to knees.',
                                'Lower slowly and with control, feeling that deep stretch in your glutes.'
                            ],
                            commonMistakes: [
                                'Arching your lower back excessively (tuck your pelvis slightly to keep tension on the glutes).',
                                'Not getting a full hip extension at the top (don\'t be shy, thrust those hips!).',
                                'Using too much quad by placing feet too close to the bench.',
                                'Rushing the movement and not feeling the glute squeeze (slow and controlled is key!).'
                            ]
                        },
                        { 
                            name: 'Romanian Deadlift (RDL)', 
                            purpose: 'This is a powerhouse for building hamstring and glute size, really emphasizing the stretch under load. Amazing for your entire posterior chain!', 
                            sets: '3–4', reps: '8–12', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Stand with feet hip-width apart, a slight bend in your knees throughout the entire movement. Hold the barbell with an overhand grip.',
                                'Hinge at your hips, pushing your butt way back as the bar descends down your thighs, keeping it super close to your body.',
                                'Keep your back straight, chest up. You should feel a deep, intense stretch in your hamstrings. Stop before your lower back starts to round!',
                                'Drive your hips forward to return to the start, squeezing those glutes hard!'
                            ],
                            commonMistakes: [
                                'Rounding your back (major injury risk!). Keep that back flat like a board.',
                                'Squatting instead of hinging at the hips (it\'s not a squat!).',
                                'Not keeping the bar close to your body (it\'ll drift away and strain your back).',
                                'Going too deep and losing tension in your hamstrings.'
                            ]
                        },
                        { 
                            name: 'Cable Pull-Through', 
                            purpose: 'Excellent for glute and hamstring activation, focusing on that hip hinge motion without putting stress on your spine. Great for feeling the glutes!', 
                            sets: '3', reps: '12–15', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Stand facing away from a low cable pulley, with the rope handle between your legs.',
                                'Hinge at your hips, letting the rope pull through your legs, feeling a stretch in your hamstrings.',
                                'Drive your hips forward powerfully, squeezing your glutes to bring the rope through and stand tall.',
                                'Keep your core tight and back straight throughout.'
                            ],
                            commonMistakes: [
                                'Squatting down instead of hinging (it\'s a hip movement!).',
                                'Using too much lower back instead of glutes/hams.',
                                'Not getting a full hip extension and glute squeeze at the top.'
                            ]
                        },
                        { 
                            name: 'Leg Curl (Seated or Lying)', 
                            purpose: 'This move isolates your hamstrings for direct hypertrophy. Crucial for balanced leg development and creating that defined look!', 
                            sets: '3', reps: '10–15', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Position yourself so the pad is on your lower calves/Achilles tendon.',
                                'Curl the weight up, focusing on squeezing your hamstrings hard.',
                                'Control the weight on the way down, resisting the pull.',
                                'Avoid lifting your hips off the pad (if lying) or using your lower back.'
                            ],
                            commonMistakes: [
                                'Using too much weight and arching your back.',
                                'Not getting a full contraction at the top.',
                                'Rushing the movement, especially the eccentric (slow and controlled is key!).'
                            ]
                        },
                        { 
                            name: 'Glute Medius Kickback (Cable)', 
                            purpose: 'Time to build those side glutes (gluteus medius) for a rounder, fuller look and better hip stability. Say hello to those hip dips disappearing!', 
                            sets: '3', reps: '12–15/side', rest: '60 sec', rir: '1–2',
                            formTips: [
                                'Attach an ankle strap to the cable. Stand facing the machine, with a slight lean forward and your core tight.',
                                'Kick your leg back and slightly out to the side, focusing on squeezing the side of your glute.',
                                'Keep your torso stable – don\'t rotate your hips to cheat!',
                                'Control the return slowly.'
                            ],
                            commonMistakes: [
                                'Using momentum to swing the leg.',
                                'Rotating the torso or hips to compensate (keep it strict!).',
                                'Not feeling the glute medius working (often indicates too much weight or poor form).'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Hamstring stretch (seated or standing), Glute stretch (figure-four stretch), Hip flexor stretch (kneeling lunge stretch). Hold each for 20-30 seconds, feeling a gentle pull.'
                    ]
                },
                '2': {
                    title: 'Tuesday: Upper Body & Core - Balanced Gains Day!',
                    description: 'Today, we\'re giving those hard-working legs a well-deserved break and focusing on building a strong upper body and core. This isn\'t just for aesthetics; a strong upper body and core will seriously boost your lower body lifts!',
                    warmup: [
                        '5-10 minutes light cardio (like elliptical or bike) to get warm.',
                        'Dynamic stretches: Arm circles, shoulder rotations, band pull-aparts, and torso twists to mobilize your upper body.',
                        '2-3 warm-up sets for your first compound upper body exercise to get those muscles ready.'
                    ],
                    exercises: [
                        { name: 'Dumbbell Bench Press', purpose: 'Builds chest, shoulders, and triceps. Gives you a great range of motion compared to a barbell.', sets: '3-4', reps: '8-12', rest: '2 min', rir: '1-2' },
                        { name: 'Lat Pulldown', purpose: 'Targets your back width (lats) for that V-taper look.', sets: '3-4', reps: '10-15', rest: '90 sec', rir: '1-2' },
                        { name: 'Seated Dumbbell Shoulder Press', purpose: 'Builds serious shoulder mass and strength. Get those delts popping!', sets: '3', reps: '10-15', rest: '90 sec', rir: '1-2' },
                        { name: 'Cable Row', purpose: 'Builds back thickness and mid-back development. Think dense, powerful back muscles.', sets: '3', reps: '10-15', rest: '90 sec', rir: '1-2' },
                        { name: 'Bicep Curl (Dumbbell or Barbell)', purpose: 'Classic bicep builder for arm size. Get that sleeve-filling pump!', sets: '3', reps: '12-15', rest: '60 sec', rir: 'Failure on last set' },
                        { name: 'Triceps Pushdown (Rope)', purpose: 'Isolates your triceps for arm size and definition.', sets: '3', reps: '12-15', rest: '60 sec', rir: 'Failure on last set' },
                        { name: 'Plank', purpose: 'Strengthens your entire core, especially your deep core muscles. Essential for stability in all your lifts!', sets: '3', reps: 'Hold 45-60 sec', rest: '60 sec', rir: 'N/A' }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Chest stretch, shoulder stretch, lat stretch, bicep/tricep stretch. Hold each for 20-30 seconds.'
                    ]
                },
                '3': {
                    title: 'Wednesday: Quad & Glute Focus (Heavy) - Quadzilla Time!',
                    description: 'Today is all about building those powerful quads and glutes! We\'re mixing compound and isolation movements with heavier loads. Focus on getting deep and staying in control.',
                    warmup: [
                        '5-10 minutes light cardio (like a rower or bike) to get warm.',
                        'Dynamic stretches: Leg swings, bodyweight squats, and walking lunges to prepare your lower body.',
                        'Glute Activation (5-10 minutes): Banded Glute Bridges (2 sets of 15-20 reps), Banded Lateral Walks (2 sets of 10 steps each way). Get those glutes ready to fire!'
                    ],
                    exercises: [
                        { 
                            name: 'Barbell Back Squat', 
                            purpose: 'Still the king! This builds overall quad, glute, and hamstring development, plus core strength. It\'s a full-body leg builder!', 
                            sets: '4', reps: '6–10', rest: '3 min', rir: '0–1',
                            formTips: [
                                'Place the bar comfortably on your upper back (high bar) or slightly lower (low bar), grip wide enough for comfort.',
                                'Feet shoulder-width apart, toes slightly out. Start by bending at your hips and knees at the same time.',
                                'Go deep! Descend until your hips are below your knees (or as deep as your mobility allows while keeping good form).',
                                'Keep your chest up, core super tight, and knees tracking over your toes.',
                                'Drive up through your heels, squeezing your glutes hard at the top.'
                            ],
                            commonMistakes: [
                                'Rounding your lower back (the dreaded "butt wink").',
                                'Knees caving in (valgus collapse – fix this!).',
                                'Not going deep enough (half squats = half gains!).',
                                'Lifting your heels off the ground.'
                            ]
                        },
                        { 
                            name: 'Leg Press', 
                            purpose: 'Targets your quads and glutes with less stress on your spine than squats, allowing for higher volume and intensity. Great for burning out those legs!', 
                            sets: '3–4', reps: '10–15', rest: '2 min', rir: '0–2',
                            formTips: [
                                'Place feet shoulder-width apart on the platform, toes slightly out. Lower the platform until your knees are near your chest (or as deep as comfortable without your lower back rounding).',
                                'Drive through your heels, extending your legs, but don\'t lock out your knees at the top – keep tension!',
                                'Control the eccentric phase slowly.'
                            ],
                            commonMistakes: [
                                'Rounding your lower back at the bottom.',
                                'Locking out knees at the top (bad for your joints!).',
                                'Feet too high or too low on the platform (changes what muscles you hit).'
                            ]
                        },
                        { 
                            name: 'Walking Lunges (Dumbbell)', 
                            purpose: 'An awesome unilateral (single-leg) exercise for quad and glute development. Also seriously improves your balance and stability!', 
                            sets: '3', reps: '10–12/leg', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Hold dumbbells at your sides. Step forward, lowering your back knee towards the ground (don\'t let it touch!).',
                                'Keep your front shin vertical, torso upright. Push off your front foot to step into the next lunge.',
                                'Maintain balance and control throughout the movement.'
                            ],
                            commonMistakes: [
                                'Leaning too far forward or backward.',
                                'Knee caving in on the front leg.',
                                'Not going deep enough.'
                            ]
                        },
                        { 
                            name: 'Leg Extension', 
                            purpose: 'Isolates your quads for definition and hypertrophy. Get that "quad sweep" looking good!', 
                            sets: '3', reps: '12–15', rest: '60 sec', rir: 'Failure on last set',
                            formTips: [
                                'Sit with your knees at a 90-degree angle, pad resting on your shins just above your ankles.',
                                'Extend your legs fully, squeezing your quads super hard at the top – imagine flexing for a photo!',
                                'Control the eccentric phase slowly, resisting the weight on the way down.'
                            ],
                            commonMistakes: [
                                'Using momentum to kick the weight up (no swinging!).',
                                'Not getting a full contraction at the top.',
                                'Allowing your hips to lift off the seat (stay glued!).'
                            ]
                        },
                        { 
                            name: 'Cable Glute Kickback', 
                            purpose: 'Directly targets your gluteus maximus for shape and size, emphasizing that peak contraction. Get that booty pop!', 
                            sets: '3', reps: '15-20/side', rest: '60 sec', rir: '1–2',
                            formTips: [
                                'Attach an ankle strap to the cable. Stand facing the machine, with a slight lean forward and your core tight.',
                                'Kick your leg straight back, squeezing your glute hard at the top.',
                                'Keep your torso stable – don\'t rotate your hips to cheat!',
                                'Control the return slowly, feeling the stretch.'
                            ],
                            commonMistakes: [
                                'Using momentum to swing the leg.',
                                'Arching the lower back (engage your core!).',
                                'Not feeling the glute working (often indicates too much weight or poor form).'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Quad stretch, hamstring stretch, glute stretch, hip flexor stretch, calf stretch. Hold each for 20-30 seconds.'
                    ]
                },
                '4': {
                    title: 'Thursday: Lower Body (Accessory & Isolation) - Detail Day!',
                    description: 'This day is all about hitting those smaller lower body muscles, building detail, and adding volume with lighter weights and more isolation. Great for improving your mind-muscle connection and getting a serious pump!',
                    warmup: [
                        '5-10 minutes light cardio (like elliptical or bike) to get warm.',
                        'Dynamic stretches: Hip circles, leg swings, and bodyweight squats to mobilize those joints.',
                        'Glute Activation (5-10 minutes): Banded Lateral Walks (2 sets of 15 each way), Banded Donkey Kicks (2 sets of 15 per side). Get those side glutes firing!'
                    ],
                    exercises: [
                        { 
                            name: 'Goblet Squat', 
                            purpose: 'Excellent for quad and glute depth, and fantastic for reinforcing proper squat mechanics and core stability. It\'s a great way to feel the movement!', 
                            sets: '3', reps: '12–15', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Hold a dumbbell vertically against your chest. Feet shoulder-width apart, toes slightly out.',
                                'Squat down deep, keeping your chest up and elbows inside your knees.',
                                'Drive through your heels to stand up, squeezing glutes hard at the top.'
                            ],
                            commonMistakes: [
                                'Rounding your back (keep it straight!).',
                                'Not going deep enough (full range of motion!).',
                                'Letting knees cave in (keep \'em tracking over your toes!).'
                            ]
                        },
                        { 
                            name: 'Single-Leg RDL (Dumbbell)', 
                            purpose: 'This exercise seriously improves your balance and unilaterally targets your hamstrings and glutes, helping to fix any imbalances. Get ready to feel those hammies!', 
                            sets: '3', reps: '10–12/leg', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Hold a dumbbell in the hand opposite to your standing leg. Hinge at the hip, extending the non-standing leg straight back.',
                                'Keep your back straight, core tight. Lower the dumbbell towards the floor, feeling a deep stretch in the hamstring of the standing leg.',
                                'Return to start by squeezing the glute of your standing leg.'
                            ],
                            commonMistakes: [
                                'Rounding your back (keep that back flat!).',
                                'Not hinging at the hip (you\'re squatting, not RDLing!).',
                                'Losing balance (use a lighter weight until your form is solid!).'
                            ]
                        },
                        { 
                            name: 'Hyperextension (Glute Focused)', 
                            purpose: 'This specifically targets your glutes and hamstrings with a strong squeeze at the top. Great for building that booty!', 
                            sets: '3', reps: '15–20', rest: '60 sec', rir: 'Failure on last set',
                            formTips: [
                                'Position your hips slightly above the pad, toes pointed out (45-degree angle).',
                                'Round your upper back slightly, focus on hinging at the hips, not the lower back.',
                                'Squeeze glutes hard to extend your body up, stopping when your body is straight (don\'t hyperextend!).',
                                'Hold a light plate to increase difficulty if you\'re feeling strong.'
                            ],
                            commonMistakes: [
                                'Arching your lower back (turns it into a lower back exercise, not glutes!).',
                                'Using momentum to swing up.',
                                'Not feeling the glute contraction (focus on that squeeze!).'
                            ]
                        },
                        { 
                            name: 'Seated Hip Abduction (Machine)', 
                            purpose: 'This directly targets your gluteus medius and minimus for wider, rounder glutes and better hip stability. Get those side glutes working!', 
                            sets: '3', reps: '15–20', rest: '60 sec', rir: 'Failure on last set',
                            formTips: [
                                'Sit on the machine, back straight, feet on pads. Push your knees out against the pads, squeezing your side glutes hard.',
                                'Control the return slowly – don\'t let the weight stack crash!',
                                'Focus on the contraction, not just moving the weight.'
                            ],
                            commonMistakes: [
                                'Leaning too far forward or backward to use momentum.',
                                'Not getting a full contraction or stretch.',
                                'Using too much weight and losing control.'
                            ]
                        },
                        { 
                            name: 'Standing Calf Raise', 
                            purpose: 'Don\'t neglect those calves! This develops your gastrocnemius (the bigger calf muscle) for size and power. Get ready for some serious pumps!', 
                            sets: '3', reps: '15–20', rest: '60 sec', rir: 'Failure on last set',
                            formTips: [
                                'Stand with the balls of your feet on a raised platform, heels hanging off.',
                                'Lower your heels to get a deep, deep stretch in your calves.',
                                'Raise up as high as humanly possible onto the balls of your feet, squeezing your calves hard at the peak.',
                                'Control the descent slowly – feel that stretch!'
                            ],
                            commonMistakes: [
                                'Not getting a full stretch at the bottom or full contraction at the top (full range of motion is key!).',
                                'Bouncing the weight up and down (no cheating!).',
                                'Using too much weight and sacrificing range of motion.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Inner thigh stretch, hip abduction stretch, hamstring stretch, calf stretch. Hold each for 20-30 seconds.'
                    ]
                },
                '5': {
                    title: 'Friday: Upper Body & Core - Another Balanced Day!',
                    description: 'Another session for your upper body and core. Keep pushing for strength and balanced aesthetics. Remember, a strong core supports all your lower body lifts, so don\'t slack here!',
                    warmup: [
                        '5-10 minutes light cardio to get warm.',
                        'Dynamic stretches: Arm circles, shoulder rotations, band pull-aparts, and torso twists to mobilize your upper body.',
                        '2-3 warm-up sets for your first compound upper body exercise to get those muscles ready.'
                    ],
                    exercises: [
                        { name: 'Barbell Overhead Press', purpose: 'Primary shoulder strength and mass. Hits all three deltoid heads and triceps. Get those boulder shoulders!', sets: '3-4', reps: '6-10', rest: '2-3 min', rir: '1-2' },
                        { name: 'Pull-Up (or Lat Pulldown)', purpose: 'Builds back width and overall pulling strength. Aim for strict form!', sets: '3-4', reps: 'AMRAP or 8-12', rest: '2 min', rir: '1-2' },
                        { name: 'Incline Dumbbell Press', purpose: 'Targets upper chest development. Crucial for a full chest!', sets: '3', reps: '10-15', rest: '90 sec', rir: '1-2' },
                        { name: 'Face Pulls (Rope)', purpose: 'Strengthens your rear delts and upper back, seriously improving shoulder health and posture. Don\'t skip these!', sets: '3', reps: '15-20', rest: '60 sec', rir: 'Failure on last set' },
                        { name: 'Dumbbell Row (Single Arm)', purpose: 'Builds back thickness and unilateral strength. Great for fixing imbalances and getting a deep contraction.', sets: '3', reps: '8-12/side', rest: '90 sec', rir: '1-2' },
                        { name: 'Overhead Triceps Extension', purpose: 'Isolates your triceps for arm size, especially the long head. Get that horseshoe looking good!', sets: '3', reps: '12-15', rest: '60 sec', rir: 'Failure on last set' },
                        { name: 'Hanging Leg Raises', purpose: 'Targets your lower abs and hip flexors. A strong core is a strong foundation!', sets: '3', reps: '10-15', rest: '60 sec', rir: 'N/A' }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Shoulder stretch, lat stretch, chest stretch, core stretches. Hold each for 20-30 seconds.'
                    ]
                },
                '6': {
                    title: 'Saturday: Full Lower Body (Volume & Endurance) - The Finisher!',
                    description: 'This is your final leg day of the week, and we\'re going for high volume and metabolic stress to really push growth and endurance across ALL your lower body muscles. Focus on feeling that insane burn and getting a massive pump!',
                    warmup: [
                        '5-10 minutes light cardio (like elliptical or bike) to get warm.',
                        'Dynamic stretches: Leg swings, bodyweight squats, and hip circles to get those joints ready.',
                        'Glute Activation (5-10 minutes): Banded Glute Bridges (2 sets of 15-20 reps), Banded Lateral Walks (2 sets of 10 steps each way). Get those glutes fired up for the final push!'
                    ],
                    exercises: [
                        { 
                            name: 'Hack Squat (Machine)', 
                            purpose: 'Excellent for quad development, allowing for a super deep range of motion and consistent tension. Get that quad sweep!', 
                            sets: '3–4', reps: '10–15', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Position your feet shoulder-width apart, slightly lower on the platform to emphasize quads, higher for glutes/hams.',
                                'Descend deep, keeping your back flat against the pad and knees tracking over toes.',
                                'Drive up powerfully, but don\'t lock out your knees at the top to maintain tension.'
                            ],
                            commonMistakes: [
                                'Rounding your back (keep it flat!).',
                                'Not going deep enough (full range of motion!).',
                                'Locking out knees at the top (keep that tension!).',
                                'Feet too high/low on the platform (changes muscle emphasis).'
                            ]
                        },
                        { 
                            name: 'Glute Ham Raise (GHR) or Nordic Hamstring Curl', 
                            purpose: 'One of the best exercises for hamstring strength and hypertrophy, also hits your glutes. Get ready for some serious hamstring soreness!', 
                            sets: '3', reps: 'AMRAP (controlled)', rest: '2 min', rir: 'Failure on last set',
                            formTips: [
                                'If using GHR: Secure your feet, knees just behind the pad. Hinge at your hips, lower your torso slowly, using your hamstrings to pull yourself back up.',
                                'If doing Nordic: Anchor your feet under something sturdy. Slowly lower your body forward, resisting with your hamstrings, trying to keep your torso straight. Push back up with your hands if needed for assistance.',
                                'Focus on that super slow eccentric (lowering) phase – that\'s where the magic happens!'
                            ],
                            commonMistakes: [
                                'Using too much lower back.',
                                'Not controlling the eccentric phase (don\'t just drop!).',
                                'Rushing reps.'
                            ]
                        },
                        { 
                            name: 'Leg Press (Close Stance)', 
                            purpose: 'This variation emphasizes your outer quads (vastus lateralis) for that awesome quad sweep and overall quad development. Get ready for the burn!', 
                            sets: '3', reps: '12–15', rest: '90 sec', rir: '1–2',
                            formTips: [
                                'Place your feet closer together on the platform. Lower deep, keeping your knees tracking forward.',
                                'Drive through the balls of your feet for more quad activation.',
                                'Control the movement, don\'t lock out your knees.'
                            ],
                            commonMistakes: [
                                'Rounding lower back.',
                                'Not going deep enough.',
                                'Locking out knees.'
                            ]
                        },
                        { 
                            name: 'Dumbbell Step-Ups', 
                            purpose: 'A fantastic unilateral exercise for glutes and quads, also seriously improves your balance and stability. Build those shapely legs!', 
                            sets: '3', reps: '10–12/leg', rest: '60 sec', rir: '1–2',
                            formTips: [
                                'Use a sturdy bench or box. Step up with one leg, driving through the heel of the stepping foot.',
                                'Stand tall at the top, squeezing the glute of the working leg.',
                                'Step back down slowly and with control. Alternate legs or do all reps on one side before switching.'
                            ],
                            commonMistakes: [
                                'Pushing off the back foot too much (cheating!).',
                                'Not using a full range of motion.',
                                'Losing balance or control.'
                            ]
                        },
                        { 
                            name: 'Calf Press (Leg Press Machine)', 
                            purpose: 'This targets both your gastrocnemius and soleus, allowing you to use heavier loads for maximum calf growth. Get those calves popping!', 
                            sets: '3', reps: '15–20', rest: '60 sec', rir: 'Failure on last set',
                            formTips: [
                                'Sit on the leg press, balls of your feet on the bottom of the platform, heels hanging off.',
                                'Push the weight up by extending your ankles, squeezing calves hard at the top.',
                                'Lower slowly, getting a deep stretch in your calves.'
                            ],
                            commonMistakes: [
                                'Not getting a full range of motion.',
                                'Bouncing the weight.',
                                'Using too much weight and sacrificing form.'
                            ]
                        }
                    ],
                    cooldown: [
                        '5-10 minutes light cardio to cool down.',
                        'Static stretches: Quad stretch, hamstring stretch, glute stretch, hip flexor stretch, calf stretch. Hold each for 20-30 seconds.'
                    ]
                },
                '7': {
                    title: 'Sunday: Rest & Recover - You Earned It!',
                    description: 'This is your dedicated rest day. No heavy lifting, no intense cardio. Remember, your muscles grow and repair when you rest, not just when you\'re in the gym. Focus on quality sleep, nutritious food, and staying hydrated. Don\'t skip it – it\'s crucial for your progress!',
                    warmup: [],
                    exercises: [],
                    cooldown: []
                }
            }
        }
    };

    let currentProgram = 'ppl'; // Default to PPL
    const workoutDisplay = qs('#workout-display');
    const dayButtonsContainer = qs('#day-buttons-container');
    const pplSelectorBtn = qs('#select-ppl');
    const womenLowerBodySelectorBtn = qs('#select-women-lowerbody');

    function renderDayButtons(programKey) {
        dayButtonsContainer.innerHTML = ''; // Clear existing buttons
        const program = allWorkoutPlans[programKey];
        program.days.forEach(day => {
            const button = document.createElement('button');
            button.className = `day-button p-4 rounded-lg shadow font-bold ${day.type === 'rest' ? 'bg-gray-700 text-white' : 'bg-white'}`;
            button.dataset.day = day.id;
            button.textContent = day.name;
            dayButtonsContainer.appendChild(button);

            button.addEventListener('click', () => {
                // Remove 'active' from all day buttons
                qsa('.day-button').forEach(btn => {
                    btn.classList.remove('active');
                    // Reset background/color for non-rest buttons if they were active
                    if (allWorkoutPlans[currentProgram].days.find(d => d.id === btn.dataset.day).type !== 'rest') {
                        btn.style.backgroundColor = ''; // Reset to default
                        btn.style.color = ''; // Reset to default
                    }
                });
                // Add 'active' to the clicked button, and apply specific color if not rest day
                button.classList.add('active');
                if (day.type !== 'rest') {
                    button.style.backgroundColor = 'var(--accent)'; // Active purple
                    button.style.color = '#ffffff';
                }
                displayWorkout(programKey, day.id);
            });
        });
    }

    function displayWorkout(programKey, dayId) {
        const programData = allWorkoutPlans[programKey].data;
        const data = programData[dayId];
        if (!data) {
            workoutDisplay.innerHTML = `<p class="text-gray-600 text-center py-12">No workout data found for this day.</p>`;
            return;
        }

        let warmupHtml = data.warmup && data.warmup.length > 0 ? `
            <h4 class="text-xl font-bold mb-3 text-gray-800">Warm-up:</h4>
            <ul class="list-disc list-inside ml-4 mb-6 text-gray-700">
                ${data.warmup.map(item => `<li>${item}</li>`).join('')}
            </ul>
        ` : '';

        let exercisesHtml = '';
        if (data.exercises && data.exercises.length > 0) {
            exercisesHtml = `
                <h4 class="text-xl font-bold mb-3 text-gray-800">Exercises:</h4>
                <div class="hidden md:grid grid-cols-6 gap-4 font-bold text-gray-500 text-sm border-b pb-2 mb-2">
                    <div class="col-span-2">Exercise</div>
                    <div>Purpose</div>
                    <div>Sets</div>
                    <div>Reps</div>
                    <div>Rest</div>
                </div>
                <div class="space-y-4">
                    ${data.exercises.map(ex => `
                        <div class="py-3 border-b border-gray-200 last:border-b-0">
                            <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-2">
                                <h5 class="md:col-span-2 font-semibold text-gray-800">${ex.name}</h5>
                                <p class="text-sm text-gray-600">${ex.purpose || 'N/A'}</p>
                                <p><span class="font-medium md:hidden">Sets: </span>${ex.sets || 'N/A'}</p>
                                <p><span class="font-medium md:hidden">Reps: </span>${ex.reps || 'N/A'}</p>
                                <p><span class="font-medium md:hidden">Rest: </span>${ex.rest || 'N/A'}</p>
                            </div>
                            <div class="ml-4 mt-2 text-sm text-gray-700">
                                ${ex.formTips && ex.formTips.length > 0 ? `
                                    <h6 class="font-bold text-gray-800 mb-1">Form Tips:</h6>
                                    <ul class="list-disc list-inside ml-4 space-y-1">
                                        ${ex.formTips.map(tip => `<li>${tip}</li>`).join('')}
                                    </ul>
                                ` : ''}
                                ${ex.commonMistakes && ex.commonMistakes.length > 0 ? `
                                    <h6 class="font-bold text-gray-800 mt-3 mb-1">Common Mistakes:</h6>
                                    <ul class="list-disc list-inside ml-4 space-y-1">
                                        ${ex.commonMistakes.map(mistake => `<li>${mistake}</li>`).join('')}
                                    </ul>
                                ` : ''}
                                <button class="suggest-alternative-btn px-3 py-1 mt-3 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition duration-200 ease-in-out" data-exercise-name="${ex.name}">
                                    ✨ Suggest Alternative
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            exercisesHtml = `<p class="text-gray-600 text-center py-12">No specific exercises for today. Focus on rest and recovery!</p>`;
        }

        let cooldownHtml = data.cooldown && data.cooldown.length > 0 ? `
            <h4 class="text-xl font-bold mt-6 mb-3 text-gray-800">Cool-down:</h4>
            <ul class="list-disc list-inside ml-4 text-gray-700">
                ${data.cooldown.map(item => `<li>${item}</li>`).join('')}
            </ul>
        ` : '';

        workoutDisplay.innerHTML = `
            <h3 class="text-2xl font-bold mb-2 text-gray-800">${data.title}</h3>
            <p class="text-gray-600 mb-6">${data.description}</p>
            ${warmupHtml}
            ${exercisesHtml}
            ${cooldownHtml}
        `;

        // Add event listeners for new "Suggest Alternative" buttons
        qsa('.suggest-alternative-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const exerciseName = e.target.dataset.exerciseName;
                const constraint = prompt(`Why do you need an alternative for "${exerciseName}"? (e.g., knee pain, no equipment, too easy)`);
                if (!constraint) {
                    showMessage('Alternative suggestion cancelled.', 'info');
                    return;
                }

                openLlmModal(`Alternative for ${exerciseName}`, '', true); // Show loading spinner
                try {
                    const prompt = `Suggest an alternative exercise for "${exerciseName}" for a strength training workout. The reason for needing an alternative is: "${constraint}". Provide a brief explanation of why it's a good alternative and how to perform it.`;
                    const response = await callGeminiApi(prompt);
                    modalResponseContent.innerHTML = response.replace(/\n/g, '<br>'); // Display response with line breaks
                    modalLoadingSpinner.style.display = 'none';
                    modalResponseContent.style.display = 'block';
                } catch (error) {
                    modalResponseContent.textContent = `Failed to get an alternative: ${error.message}`;
                    modalLoadingSpinner.style.display = 'none';
                    modalResponseContent.style.display = 'block';
                    showMessage('Failed to get exercise alternative.', 'error');
                }
            });
        });
    }

    function switchProgram(programKey) {
        currentProgram = programKey;
        // Update active state of program selector buttons
        pplSelectorBtn.classList.remove('active');
        womenLowerBodySelectorBtn.classList.remove('active');
        if (programKey === 'ppl') {
            pplSelectorBtn.classList.add('active');
        } else {
            womenLowerBodySelectorBtn.classList.add('active');
        }

        renderDayButtons(currentProgram);
        // Automatically display the first day of the selected program
        const firstDayButton = dayButtonsContainer.querySelector('.day-button');
        if (firstDayButton) {
            firstDayButton.classList.add('active');
            if (allWorkoutPlans[currentProgram].days[0].type !== 'rest') {
                 firstDayButton.style.backgroundColor = 'var(--accent)'; // Active purple
                 firstDayButton.style.color = '#ffffff';
            }
            displayWorkout(currentProgram, firstDayButton.dataset.day);
        }
    }

    pplSelectorBtn.addEventListener('click', () => switchProgram('ppl'));
    womenLowerBodySelectorBtn.addEventListener('click', () => switchProgram('womenLowerBody'));

    const accordionItems = qsa('.accordion-item');
    accordionItems.forEach(item => {
        const button = item.querySelector('.accordion-button');
        const content = item.querySelector('.accordion-content');
        const icon = button.querySelector('svg');

        button.addEventListener('click', () => {
            const isExpanded = content.style.maxHeight && content.style.maxHeight !== '0px';
            
            // Close all other accordions
            accordionItems.forEach(i => {
                i.querySelector('.accordion-content').style.maxHeight = '0px';
                i.querySelector('.accordion-content').style.paddingTop = '0px';
                i.querySelector('.accordion-content').style.paddingBottom = '0px';
                i.querySelector('.accordion-button svg').style.transform = 'rotate(0deg)';
            });

            // Open the clicked accordion if it was closed
            if (!isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.paddingTop = '1.25rem';
                content.style.paddingBottom = '1.25rem';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    function setupNavScroll() {
        qsa('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                qs(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    // Calorie Tracker Logic (from user's script.js, adapted)
    const generateMealIdeaBtn = qs('#generate-meal-idea');
    const mealIdeaOutputDiv = qs('#meal-idea-output');
    const mealIdeaContentDiv = qs('#meal-idea-content');

    const goalDisp = qs('#goal-display');
    const goalInp = qs('#goal-input');
    const goalForm = qs('#goal-form');
    const consumedEl = qs('#calories-consumed');
    const remainEl = qs('#calories-remaining');
    const bar = qs('#progress-bar');
    const protTot = qs('#protein-total');
    const carbTot = qs('#carbs-total');
    const fatTot = qs('#fat-total');
    const foodForm = qs('#food-form');
    const manualTog = qs('#manual-toggle');
    const foodLog = qs('#food-log');
    const ctx = qs('#weeklyChart').getContext('2d');

    let calorieGoal = +localStorage.getItem(`calorieGoal-${todayKey()}`) || 2500;
    let dailyLog = JSON.parse(localStorage.getItem(`calorieLog-${todayKey()}`) || '[]');
    let weeklyChart;

    goalDisp.textContent = calorieGoal;
    goalInp.value = calorieGoal;

    goalForm.addEventListener('submit', e => {
        e.preventDefault();
        const g = +goalInp.value;
        if (g > 0) {
            calorieGoal = g;
            localStorage.setItem(`calorieGoal-${todayKey()}`, g);
            renderTotals();
            drawChart();
            showMessage('Daily calorie goal updated!', 'success');
        } else {
            showMessage('Please enter a valid calorie goal (greater than 0).');
        }
    });

    /* API fetch */
    async function fetchNutrition(q) {
        try {
            const res = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-app-id': NIX_APP_ID, 'x-app-key': NIX_APP_KEY },
                body: JSON.stringify({ query: q })
            });
            if (!res.ok) throw new Error('API lookup failed.');
            const d = await res.json();
            const f = d.foods?.[0];
            if (!f) return null;
            return {
                name: f.food_name,
                calories: Math.round(f.nf_calories),
                protein: +f.nf_protein.toFixed(1),
                carbs: +f.nf_total_carbohydrate.toFixed(1),
                fat: +f.nf_total_fat.toFixed(1)
            };
        } catch (error) {
            console.error("Nutritionix API error:", error);
            showMessage('Error looking up food. Please try again or use manual entry.');
            return null;
        }
    }

    /* totals */
    function renderTotals() {
        foodLog.innerHTML = dailyLog.map(f => `
            <li>
                <span>${f.name}</span>
                <span>${f.calories} kcal</span>
                <span>${f.protein}/${f.carbs}/${f.fat} g</span>
                <button class="delete-btn" data-id="${f.id}">×</button>
            </li>`).join('');
        const c = dailyLog.reduce((t, f) => t + f.calories, 0);
        const p = dailyLog.reduce((t, f) => t + f.protein, 0);
        const cb = dailyLog.reduce((t, f) => t + f.carbs, 0);
        const ft = dailyLog.reduce((t, f) => t + f.fat, 0);

        consumedEl.textContent = c;
        remainEl.textContent = Math.max(calorieGoal - c, 0);
        bar.style.width = Math.min(c / calorieGoal, 1) * 100 + '%';
        bar.style.backgroundColor = c > calorieGoal ? '#e74c3c' : 'var(--accent)';
        protTot.textContent = p.toFixed(1) + ' g';
        carbTot.textContent = cb.toFixed(1) + ' g';
        fatTot.textContent = ft.toFixed(1) + ' g';
    }
    renderTotals(); // Initial render of totals

    /* add food */
    manualTog.addEventListener('change', () => foodForm.classList.toggle('manual-on', manualTog.checked));
    foodForm.addEventListener('submit', async e => {
        e.preventDefault();
        const item = qs('#food-name').value.trim();
        if (!item) {
            showMessage('Please enter a food item.');
            return;
        }
        try {
            let entry;
            if (manualTog.checked) {
                const cal = +qs('#m-cal').value || 0;
                if (!cal) {
                    showMessage('Please enter calories for manual entry.');
                    return;
                }
                entry = {
                    name: item,
                    calories: cal,
                    protein: +qs('#m-prot').value || 0,
                    carbs: +qs('#m-carb').value || 0,
                    fat: +qs('#m-fat').value || 0
                };
            } else {
                entry = await fetchNutrition(item);
                if (!entry) {
                    showMessage('Could not look up that food. Try a different phrasing or use manual entry.');
                    return;
                }
            }
            dailyLog.push({ id: Date.now(), ...entry });
            localStorage.setItem(`calorieLog-${todayKey()}`, JSON.stringify(dailyLog));
            foodForm.reset();
            foodForm.classList.remove('manual-on');
            renderTotals();
            drawChart();
            showMessage('Food added successfully!', 'success');
        } catch (error) {
            console.error("Add food error:", error);
            showMessage('An error occurred while adding food.');
        }
    });

    /* delete food */
    foodLog.addEventListener('click', e => {
        if (!e.target.classList.contains('delete-btn')) return;
        const id = +e.target.dataset.id;
        dailyLog = dailyLog.filter(f => f.id !== id);
        localStorage.setItem(`calorieLog-${todayKey()}`, JSON.stringify(dailyLog));
        renderTotals();
        drawChart();
        showMessage('Food entry deleted.', 'success');
    });

    /* weekly chart */
    function drawChart() {
        const labels = [], kcal = [];
        weekKeys().forEach(k => {
            labels.push(new Date(k).toLocaleDateString('en-US', { weekday: 'short' }));
            const log = JSON.parse(localStorage.getItem(`calorieLog-${k}`) || '[]');
            kcal.push(log.reduce((t, f) => t + f.calories, 0));
        });
        if (weeklyChart) weeklyChart.destroy();
        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ data: kcal, backgroundColor: 'var(--accent)' }] },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e0e0e0' // Lighter grid lines
                        }
                    },
                    x: {
                        grid: {
                            display: false // No vertical grid lines
                        }
                    }
                }
            }
        });
    }
    drawChart(); // Initial draw of chart

    // LLM Feature: Generate Meal Idea
    generateMealIdeaBtn.addEventListener('click', async () => {
        const remainingCals = +remainEl.textContent;
        const totalProtein = +protTot.textContent.replace(' g', '');
        const totalCarbs = +carbTot.textContent.replace(' g', '');
        const totalFat = +fatTot.textContent.replace(' g', '');

        const consumedCals = +consumedEl.textContent;
        const goalCals = calorieGoal;

        // Calculate remaining macros based on goal and consumed
        // Assuming 4 kcal/g for protein/carbs, 9 kcal/g for fat
        // This is a rough estimate and might not perfectly align with Nutritionix's calculations
        // For simplicity, we'll ask the LLM to provide a meal for the *remaining* calories/macros in a general sense.
        // Or, we can give it the total consumed and goal and let it figure out the remaining.

        const prompt = `I have consumed ${consumedCals} calories today, with a goal of ${goalCals} calories. My current macro totals are: Protein ${totalProtein}g, Carbs ${totalCarbs}g, Fat ${totalFat}g. Suggest a simple, healthy meal idea that would help me meet my remaining calorie and macro goals for the day. Provide the meal name, ingredients, and a brief preparation method. Keep the tone informal and encouraging.`;

        openLlmModal('✨ Your Smart Meal Idea', '', true); // Show loading spinner

        try {
            const response = await callGeminiApi(prompt);
            mealIdeaContentDiv.innerHTML = response.replace(/\n/g, '<br>'); // Display response with line breaks
            mealIdeaOutputDiv.style.display = 'block';
            modalLoadingSpinner.style.display = 'none';
            modalResponseContent.style.display = 'block';
        } catch (error) {
            mealIdeaContentDiv.textContent = `Failed to generate meal idea: ${error.message}`;
            mealIdeaOutputDiv.style.display = 'block';
            modalLoadingSpinner.style.display = 'none';
            modalResponseContent.style.display = 'block';
            showMessage('Failed to generate meal idea.', 'error');
        }
    });


    // Initialize with the default program (PPL)
    switchProgram('ppl');
    setupNavScroll();
});
