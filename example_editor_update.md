<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Expli.Co Learning Slide Editor</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<style type="text/tailwindcss">
        :root {
            --background: #1d2a5d;
            --primary-blue: #1e3fe8;
            --primary-red: #b73031;
            --primary-gray: #687178;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--background);
        }
        .group:focus-within .group-focus-within\:block {
            display: block;
        }
        .group:focus-within .group-focus-within\:flex {
            display: flex;
        }
        .bg-custom-gray {
            background-color: var(--primary-gray);
        }
        .hover\:bg-custom-gray-dark:hover {
             background-color: #545b60;}
        .bg-custom-blue {
            background-color: var(--primary-blue);
        }
        .hover\:bg-custom-blue-dark:hover {
            background-color: #1833b7;}
        .bg-custom-red {
            background-color: var(--primary-red);
        }
        .hover\:bg-custom-red-dark:hover {
            background-color: #9c2829;}
        .text-custom-red {
            color: var(--primary-red);
        }
    </style>
</head>
<body class="text-gray-200">
<div class="flex flex-col h-screen">
<header class="bg-[#17214a] text-white shadow-md z-20">
<div class="container mx-auto px-6 py-3 flex justify-between items-center">
<div class="flex items-center space-x-4">
<button class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
<span class="material-icons">arrow_back_ios</span>
<span>Back</span>
</button>
<div class="w-px h-6 bg-gray-600"></div>
<span class="text-xl font-bold text-custom-red">Demo</span>
</div>
<div class="flex-1 text-center">
<div class="flex items-center justify-center">
<span class="text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-indigo-600 text-transparent bg-clip-text">Expli.Co Learning</span>
</div>
</div>
<div class="flex items-center space-x-2">
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-red hover:bg-custom-red-dark text-white rounded-lg transition-colors">
<span class="material-icons">play_circle_outline</span>
<span>Live Preview</span>
</button>
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-blue hover:bg-custom-blue-dark text-white rounded-lg transition-colors">
<span class="material-icons">save</span>
<span>Save</span>
</button>
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-gray hover:bg-custom-gray-dark text-white rounded-lg transition-colors">
<span class="material-icons">share</span>
<span>Share</span>
</button>
<div class="w-px h-6 bg-gray-600"></div>
<button class="p-2 rounded-full hover:bg-gray-700 transition-colors">
<span class="material-icons">settings</span>
</button>
<button class="p-2 rounded-full hover:bg-gray-700 transition-colors">
<img alt="User avatar" class="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlDn6PanYE11Q1YWAspimiy_-s2zlX_VqD9x_nJ6ZGIsUI_724jbXqVsWUZhaTQbCS73DR8USm-qz_tdv1ZswUIAtoZEvPsINvMaBzsdPeUBLH-5IOtsUdw6fnOedp-s0NXWnW5LksWWqCXlQ1mbpW--GTlg0gepoxWj52Q5MA1FYPDwjPq4rCm5n58tWEHImKRxMUKZoj05lQE9wpJ9Qo42z06E2GGauSguVgDGLHGQ3lTDgFhNRPtUr6nV3j7Wr-iZODL8wDGw"/>
</button>
</div>
</div>
</header>
<main class="flex-1 flex items-center justify-center p-8 bg-[var(--background)] overflow-y-auto">
<div class="w-full h-full flex items-center justify-center">
<div class="relative shadow-2xl rounded-lg overflow-hidden" style="width: 80%; padding-bottom: 45%;">
<div class="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-bl-lg">desktop - 16:9</div>
<img alt="A cozy, warmly lit bookstore with glowing windows, plants, and outdoor seating on a cobblestone street at dusk." class="absolute top-0 left-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1B3UYDDD9ofX1aPglVGY1wkW_Bfq_y_u-J4qfXf54N97ySwDWyjfc46WdxUCwQ5J-BtIspMmiDX7OLXEZXP7tP85cCrShzXfv7tfUFgP_VE4RLYB0Fj3zWBfsHhPVpYOWR3zSjCRzlPfgACHFXY039A_qzm2XknhsIkGkJ5msDlo6t7WOndTN9_pIvTyDMgLis_q0UYaJE0YLpwsl1OBtmpbVrV8BIsl--LKzTM0-o2nYmZFojaU96caP4PBy1WJeHLNKBHjWKg"/>
</div>
</div>
</main>
<footer class="bg-[#17214a] text-white shadow-md z-10 p-3 flex justify-center items-center space-x-2">
<div class="relative group">
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-gray hover:bg-custom-gray-dark rounded-lg transition-colors">
<span class="material-icons">wallpaper</span>
<span>Background</span>
</button>
<div class="hidden group-focus-within:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 bg-[#2c3a6f] p-6 rounded-lg shadow-2xl border border-[#3e4f8a]">
<div class="flex flex-col space-y-6">
<div>
<h3 class="text-md font-semibold mb-3 text-gray-200">Background Type</h3>
<div class="grid grid-cols-3 gap-2">
<button class="flex flex-col items-center justify-center p-2 border border-[var(--primary-gray)] rounded-lg bg-[#2c3a6f] hover:bg-[#3e4f8a] transition-colors">
<span class="material-icons text-gray-300 text-base">block</span>
<span class="text-xs mt-1 text-gray-300">None</span>
</button>
<button class="flex flex-col items-center justify-center p-2 border border-[var(--primary-gray)] rounded-lg bg-[#2c3a6f] hover:bg-[#3e4f8a] transition-colors">
<span class="material-icons text-gray-300 text-base">palette</span>
<span class="text-xs mt-1 text-gray-300">Color</span>
</button>
<button class="flex flex-col items-center justify-center p-2 border border-[var(--primary-gray)] rounded-lg bg-[#2c3a6f] hover:bg-[#3e4f8a] transition-colors">
<span class="material-icons text-gray-300 text-base">image</span>
<span class="text-xs mt-1 text-gray-300">Image</span>
</button>
<button class="flex flex-col items-center justify-center p-2 border border-[var(--primary-gray)] rounded-lg bg-[#2c3a6f] hover:bg-[#3e4f8a] transition-colors">
<span class="material-icons text-gray-300 text-base">videocam</span>
<span class="text-xs mt-1 text-gray-300">Video</span>
</button>
<button class="col-span-3 flex items-center justify-center p-2 bg-custom-blue text-white rounded-lg shadow-sm hover:bg-custom-blue-dark transition-colors">
<span class="material-icons mr-2 text-base">smart_display</span>
<span class="text-sm">YouTube</span>
</button>
</div>
</div>
<div>
<label class="block text-xs font-medium text-gray-400 mb-1" for="youtube-url-footer">YouTube URL</label>
<div class="flex items-center space-x-2">
<input class="flex-1 block w-full px-2 py-1.5 bg-[#17214a] border border-[var(--primary-gray)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] sm:text-sm text-white" id="youtube-url-footer" placeholder="Paste your YouTube video URL" type="text"/>
<button class="px-3 py-1.5 bg-custom-blue text-white text-sm rounded-md hover:bg-custom-blue-dark transition-colors">Apply</button>
</div>
</div>
</div>
</div>
</div>
<div class="relative group">
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-gray hover:bg-custom-gray-dark rounded-lg transition-colors">
<span class="material-icons">aspect_ratio</span>
<span>Aspect Ratio</span>
</button>
<div class="hidden group-focus-within:flex absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#2c3a6f] p-4 rounded-lg shadow-2xl border border-[#3e4f8a] flex-col space-y-4 w-64">
<div>
<h3 class="text-md font-semibold mb-2 text-gray-200">Aspect Ratio</h3>
<div class="flex bg-[#17214a] p-1 rounded-lg">
<button class="flex-1 p-2 text-sm rounded-md bg-custom-blue shadow text-white transition-all duration-300">16:9</button>
<button class="flex-1 p-2 text-sm rounded-md text-gray-300 hover:bg-[#3e4f8a] transition-all duration-300">9:16</button>
<button class="flex-1 p-2 text-sm rounded-md text-gray-300 hover:bg-[#3e4f8a] transition-all duration-300">4:3</button>
<button class="flex-1 p-2 text-sm rounded-md text-gray-300 hover:bg-[#3e4f8a] transition-all duration-300">1:1</button>
</div>
</div>
</div>
</div>
<button class="flex items-center space-x-2 px-4 py-2 bg-custom-red hover:bg-custom-red-dark text-white rounded-lg transition-colors">
<span class="material-icons">add_circle</span>
<span>Add Hotspot</span>
</button>
</footer>
</div>

</body></html>