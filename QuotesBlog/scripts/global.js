{// Login/Register Popup loader
    //*** only on GET/test, should be any action that requires auth
    //    every element that requires auth, should get a class of 'authRequired'
    //    but just if '!isloggedIn' (via ejs), then, swap textInput by all the class collection
    let authRequiredCollection = document.getElementsByClassName('authRequired');
    
    for (let index = 0; index < authRequiredCollection.length; index++) {
        authRequiredCollection[index].addEventListener('click', (e)=>{
            e.preventDefault();
            renderPopup();
        });
    }

    async function renderPopup(){
        if(!document.getElementById('loginDiv')){
            let popupDiv = document.createElement('div');
            popupDiv.innerHTML = await (await fetch('/test',{method:'POST'})).text();
            popupDiv.id = 'popupDiv';
            
            let loginPopupScript = document.createElement('script');
            loginPopupScript.innerHTML = await(await fetch('/scripts/loginPopup.js')).text();
            
            let body = document.body;
            body.append(popupDiv);
            body.append(loginPopupScript);
        }else{
            document.getElementById('popupDiv').style.display = 'block';
        }
    }
}

// Put here functions to change the 'favorited' status on buttons
// Put here functions to add the delete post button.
// this two should interchange one another based on isLoggedIn status

// Put here navbar menus and animations functions