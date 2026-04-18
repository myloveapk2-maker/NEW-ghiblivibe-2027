/**
 * Blogger XML Template for Ghiblivibe
 * This is a complete XML structure for a Pinterest-style Blogger theme.
 */

export const BLOGGER_XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsversion='3' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/schemas/blogger/v2' xmlns:data='http://www.google.com/schemas/blogger/v2/data' xmlns:expr='http://www.google.com/schemas/blogger/v2/expr'>
<head>
    <meta content='width=device-width, initial-scale=1' name='viewport'/>
    <link href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&amp;family=Inter:wght@400;600&amp;display=swap' rel='stylesheet'/>
    <title><data:blog.pageTitle/></title>
    <b:skin><![CDATA[
    /*
     * Theme Name: Ghiblivibe Pinterest Style
     * Author: Google AI Studio Build
     */
    
    /* Reset & Base */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Playfair Display', serif;
        font-weight: 700;
        font-style: italic;
        background-color: #f7f7f7;
        color: #333;
        line-height: 1.6;
    }
    
    /* Header */
    header {
        background: #fff;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    .header-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .logo {
        font-size: 28px;
        font-weight: 900;
        color: #dc2626;
        text-decoration: none;
        white-space: nowrap;
        font-family: serif;
        margin-right: 12px;
    }
    
    /* Search Bar */
    .search-container {
        flex-grow: 1;
        position: relative;
        max-width: 800px;
    }
    .search-input {
        width: 100%;
        background: #f1f1f1;
        border: 2px solid transparent;
        padding: 10px 16px 10px 44px;
        border-radius: 24px;
        font-size: 15px;
        font-weight: 500;
        outline: none;
        transition: all 0.2s;
        color: #333;
    }
    .search-input:focus {
        background: #fff;
        border-color: #dc2626;
        box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
    }
    .search-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #767676;
        font-size: 18px;
    }

    /* AI Generator Button */
    .ai-gen-btn {
        background: #dc2626;
        color: #fff;
        padding: 10px 20px;
        border-radius: 24px;
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }
    .ai-gen-btn:hover {
        background: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
    }

    /* Category Navigation */
    .nav-categories {
        background: #fff;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
    }
    .nav-categories::-webkit-scrollbar { display: none; }
    .nav-categories-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        gap: 8px;
    }
    .cat-link {
        color: #4b5563;
        text-decoration: none;
        font-weight: 700;
        font-size: 13px;
        padding: 8px 16px;
        border-radius: 20px;
        transition: all 0.2s;
        background: #f3f4f6;
    }
    .cat-link:hover { 
        background: #e5e7eb;
        color: #111;
    }
    .cat-link.active { 
        background: #111; 
        color: #fff; 
    }

    /* Explore Section */
    .explore-section {
        max-width: 1200px;
        margin: 30px auto 10px;
        padding: 0 20px;
    }
    .explore-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 20px;
    }
    .explore-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
    }
    .explore-item {
        height: 100px;
        border-radius: 12px;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
        position: relative;
        overflow: hidden;
    }
    .explore-item::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.3);
    }
    .explore-item span { position: relative; z-index: 1; }
    
    /* Layout Container */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 15px;
    }
    
    /* Main Content (Masonry Grid) */
    .grid {
        margin: 0 -8px;
    }
    .grid-item {
        width: 20%;
        padding: 8px;
        float: left;
    }
    @media (max-width: 1280px) { .grid-item { width: 25%; } }
    @media (max-width: 1024px) { .grid-item { width: 33.33%; } }
    @media (max-width: 768px) { .grid-item { width: 50%; } }
    @media (max-width: 480px) { .grid-item { width: 100%; } }
    
    /* Post Card Animation */
    .grid-item {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), 
                    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .grid-item.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    
    /* Post Card */
    .post-card {
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
    }
    .post-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    .post-card img {
        width: 100%;
        display: block;
        height: auto;
        transition: transform 0.5s;
    }
    .post-card:hover img {
        transform: scale(1.05);
    }
    .post-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
        text-align: center;
    }
    .post-card:hover .post-overlay {
        opacity: 1;
    }
    .post-title {
        color: #fff;
        font-size: 16px;
        font-weight: 800;
        text-decoration: none;
        margin-bottom: 12px;
        line-height: 1.3;
    }
    
    /* Post Actions */
    .post-actions {
        position: absolute;
        bottom: 15px;
        right: 15px;
        display: flex;
        gap: 10px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    }
    .post-card:hover .post-actions {
        opacity: 1;
        transform: translateY(0);
    }
    .action-btn {
        background: #fff;
        color: #111;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }
    .action-btn:hover {
        transform: scale(1.1);
        background: #efefef;
    }
    .action-btn.like-btn {
        position: relative;
    }
    .reactions-bar {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: #fff;
        padding: 5px 10px;
        border-radius: 30px;
        display: flex;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10;
    }
    .action-btn.like-btn:hover .reactions-bar {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }
    .reaction-emoji {
        font-size: 20px;
        cursor: pointer;
        transition: transform 0.2s;
        text-decoration: none;
    }
    .reaction-emoji:hover {
        transform: scale(1.3);
    }
    
    .action-btn.like-btn:hover {
        color: #e60023;
    }
    
    /* Comment Section */
    #comments {
        max-width: 800px;
        margin: 40px auto;
        padding: 0 20px;
        background: #fff;
        border-radius: 16px;
        padding: 30px;
    }
    .comment-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
    }
    .comment-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    .comment-input {
        width: 100%;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 15px;
        font-size: 14px;
        outline: none;
        resize: vertical;
        min-height: 100px;
        transition: border-color 0.3s;
    }
    .comment-input:focus {
        border-color: #e60023;
    }
    .comment-submit {
        align-self: flex-end;
        background: #e60023;
        color: #fff;
        border: none;
        padding: 10px 25px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.3s;
    }
    .comment-submit:hover {
        background: #ad081b;
    }
    
    /* Color Picker */
    .color-picker-container {
        position: relative;
        display: inline-block;
    }
    .color-picker-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        color: #767676;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .color-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        padding: 15px;
        display: none;
        flex-direction: column;
        gap: 10px;
        z-index: 1001;
        width: 200px;
    }
    .color-menu.active { display: flex; }
    .color-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }
    .color-option {
        width: 100%;
        height: 25px;
        border-radius: 6px;
        border: 1px solid #ddd;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .color-option:hover { transform: scale(1.1); }
    
    .upload-btn {
        background: #efefef;
        border: none;
        padding: 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        text-align: center;
    }
    .upload-btn:hover { background: #e1e1e1; }
    
    /* Background Image Support */
    body {
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        background-repeat: no-repeat;
    }
    
    /* Dark Mode Overrides */
    body.dark-mode { background-color: #1a1a1a; color: #fff; }
    body.dark-mode header, body.dark-mode .nav-categories { background: #1a1a1a; border-color: #333; }
    body.dark-mode .logo { color: #ff4d4d; }
    body.dark-mode .search-input { background: #333; color: #fff; }
    body.dark-mode .cat-link { color: #ccc; }
    body.dark-mode .cat-link.active { background: #fff; color: #111; }
    body.dark-mode .post-card { background: #2a2a2a; color: #fff; }
    body.dark-mode .explore-title { color: #fff; }
    
    /* Auth Section */
    .auth-btn {
        background: #e60023;
        color: #fff;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.3s;
    }
    .auth-btn:hover { background: #ad081b; }
    
    .user-profile {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        position: relative;
    }
    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #eee;
        object-fit: cover;
    }
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        padding: 10px;
        display: none;
        width: 150px;
        z-index: 1001;
    }
    .user-profile:hover .user-dropdown { display: block; }
    .dropdown-item {
        padding: 8px 12px;
        font-size: 13px;
        color: #333;
        text-decoration: none;
        display: block;
        border-radius: 6px;
    }
    .dropdown-item:hover { background: #f5f5f5; }
    .dropdown-item.logout { color: #e60023; }
    
    /* Recommendation Toast */
    .recommend-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #fff;
        border: 1px solid #eee;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border-radius: 20px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        z-index: 9999;
        max-width: 400px;
        width: 90%;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .recommend-toast.active { transform: translateX(-50%) translateY(0); }
    
    /* Share Menu */
    .share-container {
        position: relative;
        display: inline-block;
    }
    .share-menu {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: #fff;
        padding: 10px;
        border-radius: 16px;
        display: none;
        gap: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 100;
        width: max-content;
    }
    .share-menu.active { display: flex; }
    .share-item {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }
    .share-item:hover { transform: scale(1.2); }
    .share-item img { width: 18px; height: 18px; filter: brightness(0) invert(1); }
    
    .share-fb { background: #1877F2; }
    .share-tw { background: #000000; }
    .share-wa { background: #25D366; }
    .share-tg { background: #0088cc; }
    .share-gm { background: #EA4335; }
    .share-cp { background: #f0f0f0; border: none; cursor: pointer; color: #333; }
    .share-cp:hover { background: #e0e0e0; }
    .share-cp svg { width: 18px; height: 18px; }
    
    /* Sidebar */
    aside {
        display: none; /* Minimalist: Hidden on home, can be enabled for posts */
    }
    
    /* Load More Button */
    .load-more-container {
        text-align: center;
        margin: 40px 0;
        width: 100%;
    }
    .load-more-btn {
        background: #e60023;
        color: #fff;
        padding: 12px 30px;
        border-radius: 25px;
        text-decoration: none;
        font-weight: 600;
        display: inline-block;
        transition: background 0.3s;
    }
    .load-more-btn:hover {
        background: #ad081b;
    }

    /* Post Info (Below Card) */
    .post-info {
        padding: 12px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .post-author {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #374151;
        text-decoration: none;
    }
    .post-author img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .post-category {
        font-size: 10px;
        font-weight: 800;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Post View (Single Page) */
    .post-view-container {
        max-width: 1100px;
        margin: 40px auto;
        background: #fff;
        border-radius: 40px;
        overflow: hidden;
        display: flex;
        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        border: 1px solid #f0f0f0;
    }
    .post-view-image-side {
        flex: 1.3;
        background: #f9fafb;
    }
    .post-view-image-side img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
    .post-view-details-side {
        flex: 1;
        padding: 48px;
        display: flex;
        flex-direction: column;
        border-left: 1px solid #f0f0f0;
    }
    .post-view-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32px;
    }
    .author-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .author-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fee2e2;
    }
    .author-name {
        font-size: 16px;
        font-weight: 800;
        color: #111;
    }
    .follow-btn {
        background: #f3f4f6;
        color: #111;
        border: none;
        padding: 10px 24px;
        border-radius: 24px;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .follow-btn:hover { background: #e5e7eb; }
    
    .post-view-title {
        font-size: 32px;
        font-weight: 900;
        margin-bottom: 20px;
        line-height: 1.2;
        color: #111;
    }
    .post-view-content {
        font-size: 16px;
        color: #4b5563;
        line-height: 1.7;
        margin-bottom: 32px;
        font-family: 'Inter', sans-serif;
    }
    .post-view-stats {
        display: flex;
        gap: 24px;
        padding: 24px 0;
        border-top: 1px solid #f3f4f6;
        border-bottom: 1px solid #f3f4f6;
        margin-bottom: 32px;
    }
    .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 800;
        color: #111;
        text-decoration: none;
    }
    
    @media (max-width: 900px) {
        .post-view-container {
            flex-direction: column;
            margin: 16px;
            border-radius: 24px;
        }
        .post-view-image-side {
            height: 450px;
        }
        .post-view-details-side {
            border-left: none;
            border-top: 1px solid #f3f4f6;
            padding: 32px;
        }
    }

    /* Blogger Specific Overrides */
    .section, .widget { margin: 0; padding: 0; }
    ]]></b:skin>
    
    <!-- Scripts -->
    <script src='https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js'></script>
    <script src='https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js'></script>
</head>

<body>
    <header>
        <div class='header-content'>
            <h1><a class='logo' href='/'>𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮</a></h1>
            <div class='search-container'>
                <span class='search-icon'>🔍</span>
                <form action='/search' method='get'>
                    <input class='search-input' name='q' placeholder='Search for aesthetics, characters, movies...' type='text'/>
                </form>
            </div>
            <div style='display: flex; gap: 12px; align-items: center;'>
                <a class='ai-gen-btn' href='#'>
                    <span>✨</span> AI Generator
                </a>
                <div id='auth-container'>
                    <!-- Logged Out -->
                    <a class='auth-btn' href='#' id='login-btn' style='background: #f3f4f6; color: #111; box-shadow: none;'>Sign In</a>
                    
                    <!-- Logged In (Hidden by default) -->
                    <div class='user-profile' id='user-profile' style='display: none;'>
                        <img class='user-avatar' id='user-img' src=''/>
                        <div class='user-dropdown'>
                            <a class='dropdown-item' href='#'>My Profile</a>
                            <a class='dropdown-item' href='#'>Settings</a>
                            <a class='dropdown-item logout' href='#' id='logout-btn'>Logout</a>
                        </div>
                    </div>
                </div>
                
                <div class='color-picker-container'>
                    <button class='color-picker-btn' id='color-toggle' title='Change Theme Color'>
                        <svg height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM7 12a5 5 0 1 1 10 0 5 5 0 0 1-10 0z' fill='currentColor'/></svg>
                    </button>
                    <div class='color-menu' id='color-menu'>
                        <div style='font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; margin-bottom: 5px;'>Colors</div>
                        <div class='color-grid'>
                            <div class='color-option' onclick='setTheme("#ffffff")' style='background: #ffffff;' title='Default'/>
                            <div class='color-option' onclick='setTheme("#fff5f5")' style='background: #fff5f5;' title='Pink'/>
                            <div class='color-option' onclick='setTheme("#f0f9ff")' style='background: #f0f9ff;' title='Blue'/>
                            <div class='color-option' onclick='setTheme("#f6fdf5")' style='background: #f6fdf5;' title='Green'/>
                            <div class='color-option' onclick='setTheme("#fffdf5")' style='background: #fffdf5;' title='Cream'/>
                            <div class='color-option' onclick='setTheme("#1a1a1a")' style='background: #1a1a1a;' title='Dark'/>
                        </div>
                        <div style='font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; margin: 10px 0 5px;'>Image</div>
                        <button class='upload-btn' onclick='document.getElementById("bg-upload").click()'>Upload Background</button>
                        <input accept='image/*' id='bg-upload' onchange='handleBgUpload(this)' style='display: none;' type='file'/>
                        <button class='upload-btn' onclick='clearBgImage()' style='background: #fff0f0; color: #e60023; margin-top: 5px;'>Clear Image</button>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <nav class='nav-categories'>
        <div class='nav-categories-content'>
            <a class='cat-link active' href='/'>All</a>
            <a class='cat-link' href='/search/label/AI%20Generated'>AI Generated</a>
            <a class='cat-link' href='/search/label/Animals'>Animals</a>
            <a class='cat-link' href='/search/label/Spirited%20Away'>Spirited Away</a>
            <a class='cat-link' href='/search/label/Totoro'>Totoro</a>
            <a class='cat-link' href='/search/label/Howl'>Howl's Castle</a>
            <a class='cat-link' href='/search/label/Kiki'>Kiki's Delivery</a>
            <a class='cat-link' href='/search/label/Mononoke'>Mononoke</a>
            <a class='cat-link' href='/search/label/Ponyo'>Ponyo</a>
            <a class='cat-link' href='/search/label/Aesthetics'>Aesthetics</a>
        </div>
    </nav>

    <div class='explore-section'>
        <h2 class='explore-title'>Explore Ghibli Vibes</h2>
        <div class='explore-grid'>
            <a class='explore-item' href='#' style='background-image: url(https://picsum.photos/seed/ghibli1/300/200)'><span>Wallpapers</span></a>
            <a class='explore-item' href='#' style='background-image: url(https://picsum.photos/seed/ghibli2/300/200)'><span>Characters</span></a>
            <a class='explore-item' href='#' style='background-image: url(https://picsum.photos/seed/ghibli3/300/200)'><span>Scenery</span></a>
            <a class='explore-item' href='#' style='background-image: url(https://picsum.photos/seed/ghibli4/300/200)'><span>Fan Art</span></a>
            <a class='explore-item' href='#' style='background-image: url(https://picsum.photos/seed/ghibli5/300/200)'><span>Quotes</span></a>
        </div>
    </div>

    <div class='container'>
        <div id='main-wrapper'>
            <b:section id='main' showaddelement='yes'>
                <b:widget id='Blog1' locked='true' title='Blog Posts' type='Blog'>
                    <b:includable id='main'>
                        <b:if cond='data:view.isPost'>
                            <!-- Single Post View -->
                            <div class='post-view-container'>
                                <div class='post-view-image-side'>
                                    <b:if cond='data:post.firstImageUrl'>
                                        <img expr:src='data:post.firstImageUrl'/>
                                    <b:else/>
                                        <img src='https://via.placeholder.com/800x1000?text=𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮'/>
                                    </b:if>
                                </div>
                                <div class='post-view-details-side'>
                                    <div class='post-view-header'>
                                        <div class='author-info'>
                                            <img class='author-avatar' src='https://ui-avatars.com/api/?name=Ghibli+Artist&amp;background=fee2e2&amp;color=dc2626'/>
                                            <div class='author-name'>Ghibli Artist</div>
                                        </div>
                                        <button class='follow-btn'>Follow</button>
                                    </div>
                                    
                                    <h1 class='post-view-title'><data:post.title/></h1>
                                    
                                    <div class='post-view-content'>
                                        <data:post.body/>
                                    </div>
                                    
                                    <div class='post-view-stats'>
                                        <a class='stat-item' href='#'>❤ 1.2k</a>
                                        <a class='stat-item' href='#'>💬 48</a>
                                        <a class='stat-item' href='#'>↗ Share</a>
                                    </div>
                                    
                                    <div class='post-view-comments-section'>
                                        <b:include data='post' name='comment_picker'/>
                                    </div>
                                </div>
                            </div>
                        <b:else/>
                            <!-- Grid View -->
                            <div class='grid' id='post-grid'>
                                <b:loop values='data:posts' var='post'>
                                    <div class='grid-item'>
                                        <div class='post-card' expr:onclick='"location.href=\"" + data:post.url + "\""'>
                                            <b:if cond='data:post.firstImageUrl'>
                                                <img expr:src='data:post.firstImageUrl' loading='lazy' />
                                            <b:else/>
                                                <img loading='lazy' src='https://via.placeholder.com/400x600?text=𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮' />
                                            </b:if>
                                            <div class='post-overlay'>
                                                <h3 class='post-title'><data:post.title/></h3>
                                                <div class='post-actions'>
                                                    <div class='action-btn like-btn' onclick='event.stopPropagation()' title='Like'>
                                                        ❤
                                                        <div class='reactions-bar'>
                                                            <a class='reaction-emoji' href='#' title='Love'>❤</a>
                                                            <a class='reaction-emoji' href='#' title='Haha'>😂</a>
                                                            <a class='reaction-emoji' href='#' title='Wow'>😮</a>
                                                            <a class='reaction-emoji' href='#' title='Sad'>😢</a>
                                                            <a class='reaction-emoji' href='#' title='Angry'>😡</a>
                                                        </div>
                                                    </div>
                                                    <a class='action-btn' expr:href='data:post.url + "#comments"' onclick='event.stopPropagation()' title='Comment'>💬</a>
                                                    <div class='share-container'>
                                                        <button class='action-btn share-toggle' onclick='event.stopPropagation()' title='Share'>↗</button>
                                                        <div class='share-menu'>
                                                            <button class='share-item share-cp' expr:data-url='data:post.url' onclick='copyShareLink(event, this)' title='Copy Link'>
                                                                <svg fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'><path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/><path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/></svg>
                                                            </button>
                                                            <a class='share-item share-fb' expr:href='"https://www.facebook.com/sharer/sharer.php?u=" + data:post.url' target='_blank' title='Facebook'><img src='https://cdn-icons-png.flaticon.com/512/733/733547.png'/></a>
                                                            <a class='share-item share-tw' expr:href='"https://twitter.com/intent/tweet?url=" + data:post.url' target='_blank' title='X'><img src='https://cdn-icons-png.flaticon.com/512/5969/5969020.png'/></a>
                                                            <a class='share-item share-wa' expr:href='"https://api.whatsapp.com/send?text=" + data:post.url' target='_blank' title='WhatsApp'><img src='https://cdn-icons-png.flaticon.com/512/733/733585.png'/></a>
                                                            <a class='share-item share-tg' expr:href='"https://t.me/share/url?url=" + data:post.url' target='_blank' title='Telegram'><img src='https://cdn-icons-png.flaticon.com/512/2111/2111646.png'/></a>
                                                            <a class='share-item share-gm' expr:href='"mailto:?body=" + data:post.url' target='_blank' title='Gmail'><img src='https://cdn-icons-png.flaticon.com/512/732/732200.png'/></a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class='post-info'>
                                            <a class='post-author' href='#'>
                                                <img src='https://ui-avatars.com/api/?name=Ghibli+Artist&amp;background=fee2e2&amp;color=dc2626'/>
                                                <span>Ghibli Artist</span>
                                            </a>
                                            <b:if cond='data:post.labels'>
                                                <span class='post-category'><data:post.labels[0].name/></span>
                                            <b:else/>
                                                <span class='post-category'>Aesthetics</span>
                                            </b:if>
                                        </div>
                                    </div>
                                </b:loop>
                            </div>
                            
                            <!-- Infinite Scroll / Load More -->

                        </b:if>
                    </b:includable>
                </b:widget>
            </b:section>
        </div>
    </div>

    <script type='text/javascript'>
    //<![CDATA[
        // Initialize Masonry
        var grid = document.querySelector('#post-grid');
        var msnry;

        if (grid) {
            imagesLoaded(grid, function() {
                msnry = new Masonry(grid, {
                    itemSelector: '.grid-item',
                    columnWidth: '.grid-item',
                    percentPosition: true
                });
                
                // Trigger observer after masonry layout
                initObserver();
            });
        }

        // Intersection Observer for animations
        function initObserver() {
            var items = document.querySelectorAll('.grid-item');
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            items.forEach(function(item) {
                observer.observe(item);
            });
        }

        // Auth and Recommendation Logic
        var loginBtn = document.getElementById('login-btn');
        var logoutBtn = document.getElementById('logout-btn');
        var userProfile = document.getElementById('user-profile');
        var userImg = document.getElementById('user-img');
        var recommendToast = document.getElementById('recommend-toast');
        
        // Mock Auth for Preview (In real Blogger, use Firebase or Blogger Auth)
        function checkAuth() {
            var savedUser = localStorage.getItem('ghiblivibe-user');
            if (savedUser) {
                var userData = JSON.parse(savedUser);
                loginBtn.style.display = 'none';
                userProfile.style.display = 'flex';
                userImg.src = userData.photo;
            } else {
                loginBtn.style.display = 'flex';
                userProfile.style.display = 'none';
                
                // Show recommendation for first-time visitors
                if (!localStorage.getItem('ghiblivibe-visited')) {
                    setTimeout(function() {
                        recommendToast.classList.add('active');
                    }, 5000);
                    localStorage.setItem('ghiblivibe-visited', 'true');
                }
            }
        }
        
        if (loginBtn) {
            loginBtn.onclick = function() {
                // Mock Login
                var mockUser = { name: 'Ghibli Fan', photo: 'https://ui-avatars.com/api/?name=Ghibli+Fan' };
                localStorage.setItem('ghiblivibe-user', JSON.stringify(mockUser));
                recommendToast.classList.remove('active');
                checkAuth();
            };
        }
        
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                localStorage.removeItem('ghiblivibe-user');
                checkAuth();
            };
        }
        
        checkAuth();

        // Color Picker Logic
        var colorToggle = document.getElementById('color-toggle');
        var colorMenu = document.getElementById('color-menu');
        
        if (colorToggle) {
            colorToggle.onclick = function(e) {
                e.stopPropagation();
                colorMenu.classList.toggle('active');
            };
        }
        
        // Share Menu Logic
        document.querySelectorAll('.share-toggle').forEach(function(btn) {
            btn.onclick = function(e) {
                e.stopPropagation();
                var menu = this.nextElementSibling;
                document.querySelectorAll('.share-menu').forEach(function(m) {
                    if (m !== menu) m.classList.remove('active');
                });
                menu.classList.toggle('active');
            };
        });
        
        window.onclick = function() {
            if (colorMenu) colorMenu.classList.remove('active');
            document.querySelectorAll('.share-menu').forEach(function(m) {
                m.classList.remove('active');
            });
        };
        
        function copyShareLink(e, btn) {
            e.stopPropagation();
            var url = btn.getAttribute('data-url');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function() {
                    var originalHtml = btn.innerHTML;
                    btn.innerHTML = '<svg fill="none" stroke="green" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    setTimeout(function() { btn.innerHTML = originalHtml; }, 2000);
                });
            } else {
                var textArea = document.createElement("textarea");
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("Copy");
                textArea.remove();
                var originalHtml = btn.innerHTML;
                btn.innerHTML = '<svg fill="none" stroke="green" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(function() { btn.innerHTML = originalHtml; }, 2000);
            }
        }
        
        function setTheme(color) {
            document.body.style.backgroundColor = color;
            document.body.style.backgroundImage = 'none';
            if (color === "#1a1a1a") {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            localStorage.setItem('ghiblivibe-bg', color);
            localStorage.removeItem('ghiblivibe-img');
        }

        function handleBgUpload(input) {
            var file = input.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var imgUrl = e.target.result;
                    document.body.style.backgroundImage = 'url(' + imgUrl + ')';
                    localStorage.setItem('ghiblivibe-img', imgUrl);
                    if (colorMenu) colorMenu.classList.remove('active');
                };
                reader.readAsDataURL(file);
            }
        }

        function clearBgImage() {
            document.body.style.backgroundImage = 'none';
            localStorage.removeItem('ghiblivibe-img');
            if (colorMenu) colorMenu.classList.remove('active');
        }
        
        // Load saved theme
        var savedBg = localStorage.getItem('ghiblivibe-bg');
        var savedImg = localStorage.getItem('ghiblivibe-img');
        
        if (savedImg) {
            document.body.style.backgroundImage = 'url(' + savedImg + ')';
        } else if (savedBg) {
            setTheme(savedBg);
        }

        // Simple Load More Logic (Blogger standard)
        // For true infinite scroll, one would typically fetch the next page via AJAX
        // and append items to the grid, then call msnry.appended(items) and msnry.layout()
    //]]>
    </script>
</body>
</html>`;
