
{// Close Popup
    let closeLoginButton = document.getElementById('closeLoginButton');
    closeLoginButton.addEventListener('click',()=>{
        popupDiv.style.display = 'none';
    });
}

{// Change Popup Tab
    let registerTab = document.getElementById('registerTab');
    let registerForm = document.getElementById('registerForm');
    let loginTab = document.getElementById('loginTab');
    let loginForm = document.getElementById('loginForm');

    registerTab.addEventListener('click', ()=>{
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    loginTab.addEventListener('click', ()=>{
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
}

{// Register form error check
    let usernameInput = document.getElementById('regUsername');
    let errorMessage = document.getElementById('errorMessage');

    usernameInput.addEventListener('keydown',(key)=>{
        if(key.code === 'Space'){
            key.preventDefault();
            errorMessage.innerText = 'Username cannot contain blank spaces';
            errorMessage.style.visibility = 'visible'
            setTimeout(()=>{
                errorMessage.style.visibility = 'hidden'
            }, 2000);
        }
    });

    usernameInput.addEventListener('keyup', async(key)=>{
        let fetcher = await fetch('/users/'+usernameInput.value);
        let usernameStatus = document.getElementById('usernameStatus');
        if(fetcher.ok){
            console.log('username taken');
            usernameStatus.innerText = 'Username Taken'
        }
        else{
            usernameStatus.innerText = 'Username Available'
            console.log('username free');
        }
        let inputCheck = usernameInput.value.replace(/\s+/g,'');
        if(inputCheck === ''){
            usernameStatus.innerText = '';
        }
    });
}

{// Form Submit
    loginForm.addEventListener('submit', async(e)=>{
        e.preventDefault()

        let formData = new FormData(loginForm);
        let urlEncoded = new URLSearchParams(formData);
        let options = {
            method:'post',
            body:urlEncoded,
        }

        let fetcher = await (await fetch('/popup_login',options)).json();

        if(!fetcher.error){
            location.replace(location.href);
        }
        else{
            errorMessage.innerText = fetcher.error;
        }

    });

    registerForm.addEventListener('submit', async(e)=>{
        e.preventDefault()

        let formData = new FormData(registerForm);
        let urlEncoded = new URLSearchParams(formData);
        let options = {
            method:'post',
            body:urlEncoded,
        }

        let fetcher = await (await fetch('/popup_register',options)).json();

        if(!fetcher.error){
            location.replace(location.href);
        }
        else{
            errorMessage.innerText = fetcher.error;
        }

    });
}