
// Login/Register Popup loader
    let isPopupActive = false;

    //*** only on GET/test, hould be any actoin that requires auth
    //    every element that requires auth, should get a class of 'authRequired'
    //    but just if '!isloggedIn', then, swap textInput by all the class collection
    let textInput = document.getElementById('text'); 
    textInput.addEventListener('click', ()=>{
        renderPopup();
    });

    async function renderPopup(){
        if(!isPopupActive){
            if(!document.getElementById('loginDiv')){
                let fetcher = await (await fetch('/test',{method:'POST'})).text();
                
                let popupDiv = document.createElement('div');
                popupDiv.innerHTML = fetcher;
                popupDiv.id = 'popupDiv';
                
                let body = document.body;
                
                body.append(popupDiv);
                isPopupActive = true;
            
                let loginPopupScript = document.createElement('script');
                loginPopupScript.innerHTML = await(await fetch('/scripts/loginPopup.js')).text();
                body.append(loginPopupScript);
            }
            else{
                document.getElementById('popupDiv').style.display = 'block';
            }
        }
    }

// Put here functions to change the 'favorited' status on buttons
// Put here functions to add the delete post button.
// this two should interchange one another based on isLoggedIn status