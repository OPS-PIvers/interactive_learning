<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Slide Editor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        /* Custom scrollbar for slide list */
        .slide-list::-webkit-scrollbar {
            width: 6px;
        }
        .slide-list::-webkit-scrollbar-track {
            background: #2d3748; /* bg-gray-800 */
        }
        .slide-list::-webkit-scrollbar-thumb {
            background: #4a5568; /* bg-gray-600 */
            border-radius: 3px;
        }
        .slide-list::-webkit-scrollbar-thumb:hover {
            background: #718096; /* bg-gray-500 */
        }
        /* Simple transition for dropdown */
        #insert-menu {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }
    </style>
</head>
<body class="bg-gray-900 text-white flex flex-col h-screen overflow-hidden">

    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-2 border-b border-gray-700 flex-shrink-0">
        <!-- Left Section -->
        <div class="flex items-center gap-4">
            <button class="hover:bg-gray-700 p-2 rounded-full w-8 h-8 flex items-center justify-center" title="Back">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h1 class="text-lg font-bold">Sample Project</h1>
            <span class="bg-gray-700 text-xs font-medium px-2 py-1 rounded">EDITOR</span>
        </div>

        <!-- Center Section -->
        <div class="flex items-center gap-3">
            <button class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-700">
                <i class="fas fa-desktop"></i>
                <span>Desktop View</span>
            </button>
            <button class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-700">
                <i class="fas fa-eye"></i>
                <span>Preview</span>
            </button>
            <!-- Insert Button with Dropdown -->
            <div class="relative inline-block text-left" id="insert-dropdown-container">
                <div>
                    <button type="button" id="insert-button" class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
                        <i class="fas fa-plus"></i>
                        <span>Insert</span>
                    </button>
                </div>
                <div id="insert-menu" class="origin-top-center absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none hidden" role="menu" aria-orientation="vertical" aria-labelledby="insert-button">
                    <div class="py-1" role="none">
                        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm" role="menuitem"><i class="fas fa-font fa-fw"></i> Text</a>
                        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm" role="menuitem"><i class="fas fa-square fa-fw"></i> Shape</a>
                        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm" role="menuitem"><i class="fas fa-crosshairs fa-fw"></i> Hotspot</a>
                        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm" role="menuitem"><i class="fas fa-image fa-fw"></i> Image</a>
                        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm" role="menuitem"><i class="fas fa-photo-video fa-fw"></i> Background Media</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-4">
            <button class="hover:bg-gray-700 p-2 rounded-full w-8 h-8 flex items-center justify-center" title="Settings">
                <i class="fas fa-cog"></i>
            </button>
            <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-md text-sm">
                Save
            </button>
            <img class="w-8 h-8 rounded-full cursor-pointer" src="https://placehold.co/32x32/a855f7/ffffff?text=U" alt="User Profile" title="Profile">
        </div>
    </header>

    <!-- Main Content -->
    <div class="flex flex-grow overflow-hidden">

        <!-- Left Panel: Slides -->
        <aside class="w-64 bg-gray-800/50 flex flex-col border-r border-gray-700 flex-shrink-0">
            <div class="p-4 border-b border-gray-700">
                <h2 class="font-semibold">Slides</h2>
            </div>
            <div class="flex-grow overflow-y-auto slide-list p-2 space-y-2">
                <!-- Active Slide -->
                <div class="bg-blue-600/30 border border-blue-500 rounded-lg p-3 cursor-pointer">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-sm">1. Interactive Slide</span>
                        <i class="fas fa-ellipsis-h text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">0 elements</p>
                </div>
                <!-- Inactive Slides -->
                <div class="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-3 cursor-pointer">
                     <div class="flex justify-between items-center">
                        <span class="font-semibold text-sm">2. Introduction</span>
                        <i class="fas fa-ellipsis-h text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">4 elements</p>
                </div>
                <div class="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-3 cursor-pointer">
                     <div class="flex justify-between items-center">
                        <span class="font-semibold text-sm">3. Key Features</span>
                        <i class="fas fa-ellipsis-h text-gray-400"></i>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">8 elements</p>
                </div>
            </div>
            <div class="p-4 border-t border-gray-700">
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                    + Add Slide
                </button>
            </div>
        </aside>

        <!-- Center Panel: Editor -->
        <main class="flex-grow flex flex-col items-center justify-center p-8 bg-gray-900">
            <!-- Canvas -->
            <div class="w-full h-full bg-gray-800 rounded-lg shadow-2xl flex items-center justify-center border-2 border-dashed border-gray-700">
                <div class="text-center text-gray-500">
                    <p>Slide 1 of 3</p>
                    <p class="text-sm">Canvas (1920x1080)</p>
                </div>
            </div>
        </main>

        <!-- Right Panel: Properties -->
        <aside class="w-80 bg-gray-800/50 flex flex-col border-l border-gray-700 flex-shrink-0">
            <div class="p-4 border-b border-gray-700">
                <h2 class="font-semibold">Properties</h2>
            </div>
            <div class="flex-grow p-4 text-center text-gray-400 flex flex-col items-center justify-center">
                <i class="fas fa-hand-pointer text-3xl mb-4"></i>
                <p>Select an element to edit its properties.</p>
            </div>
            <div class="p-4 border-t border-gray-700">
                 <button class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    View Interactions
                </button>
            </div>
        </aside>

    </div>

    <script>
        // --- Dropdown Menu Logic ---
        const insertButton = document.getElementById('insert-button');
        const insertMenu = document.getElementById('insert-menu');
        const dropdownContainer = document.getElementById('insert-dropdown-container');

        // Toggle menu visibility on button click
        insertButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the window click listener from firing immediately
            insertMenu.classList.toggle('hidden');
        });

        // Hide menu if clicked outside
        window.addEventListener('click', (event) => {
            if (!dropdownContainer.contains(event.target)) {
                insertMenu.classList.add('hidden');
            }
        });

        // Optional: Hide menu on Escape key press
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !insertMenu.classList.contains('hidden')) {
                insertMenu.classList.add('hidden');
            }
        });
    </script>
</body>
</html>
