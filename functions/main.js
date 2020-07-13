const config = {
    apiKey: "AIzaSyDYihRL0Q9CAnzEPp_0D3haOdrSgS1RPf4",
    authDomain: "postfeelings-aae40.firebaseapp.com",
    databaseURL: "https://postfeelings-aae40.firebaseio.com",
    projectId: "postfeelings-aae40",
    storageBucket: "postfeelings-aae40.appspot.com",
    messagingSenderId: "485112300090",
    appId: "1:485112300090:web:ed8ee854554b02f8bc2b03",
    measurementId: "G-W65G40N5WN"
}

firebase.initializeApp(config);

const firestore = firebase.firestore();

const posts = document.querySelector("#posts");
const createForm = document.querySelector("#createForm");
const progressBar = document.querySelector("#progressBar");
const progressHandler = document.querySelector("#progressHandler");
const postSubmit = document.querySelector("#postSubmit");
const openNav = document.querySelector("#openNav");
const closeNav = document.querySelector("#closeNav");
const loading = document.querySelector("#loading");
const editButton = document.querySelector("#edit");
const deleteButton = document.querySelector("#delete");
const singlePost = document.querySelector("#post");
const editFormContainer = document.querySelector("#editFormContainer");
let editMode = false;

const getPosts = async() =>{
    let postArray = [];
    let docs = await firebase.firestore().collection("posts").get().catch(err => console.log(err));
    docs.forEach(doc => {
        postArray.push({"id": doc.id, "data": doc.data()});
    });
    createChildren(postArray);
}

const getPost = async() => {
    let postId = getPostIdFromURL();
    if(loading != null){
        loading.innerHTML = "<div><div class='lds-dual-ring'><div></div></div><p>Loading Post...</p></div>";
    }
    let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));
    if(loading != null){
        loading.innerHTML = "";
    }
    if(post && deleteButton !=null){
        deleteButton.style.display = "block";
    }
    if(post && editButton !=null){
        editButton.style.display = "block";
    }

    createChild(post.data());
}

const createChild = (postData) => {
    if(singlePost !==null){
        let div = document.createElement("div");
        let img = document.createElement("img");
        img.setAttribute("src", postData.cover);
        img.setAttribute("loading", "Lazy");

        let tittle = document.createElement("h3");
        let tittleNode = document.createTextNode(postData.tittle);
        tittle.appendChild(tittleNode);

        let content = document.createElement("div");
        let contentNode = document.createTextNode(postData.content);
        content.appendChild(contentNode);

        div.appendChild(img);
        div.appendChild(tittle);
        div.appendChild(content);

        post.appendChild(div);
    }
}

const getPostIdFromURL = () => {
    let postLocation = window.location.href;
    let hrefArray = postLocation.split("/");
    let postId = hrefArray.slice(-1).pop();
    
    return postId;
}

const createChildren = async(arr) => {
    if(posts != null){
        arr.map(post => {
            let div = document.createElement("div");
            let cover = document.createElement("div");
            let anchor = document.createElement("a");
            let anchorNode = document.createTextNode(post.data.tittle);
            anchor.setAttribute("href", "post.html#/" + post.id);

            anchor.appendChild(anchorNode);
            cover.style.backgroundImage = "url(" + post.data.cover + ")";
            div.classList.add("post");
            div.appendChild(cover);
            div.appendChild(anchor);
            posts.appendChild(div);
        });
    }
}

const appendEditForm = async() => {
    let postId = getPostIdFromURL();
    let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));
    let d;

    let form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("id", "editForm");

    let tittleInput = document.createElement("input");
    tittleInput.setAttribute("value", post.data().tittle);
    tittleInput.setAttribute("id", "editTittle");

    let contentTextarea = document.createElement("textarea");
    contentTextarea.setAttribute("id", "editContent");

    let coverFile = document.createElement("input");
    coverFile.setAttribute("type", "file");
    coverFile.setAttribute("id", "editCover");

    let oldCover = document.createElement("input");
    oldCover.setAttribute("type", "hidden");
    oldCover.setAttribute("id", "oldCover");

    let submit = document.createElement("input");
    submit.setAttribute("value", "Update Post");
    submit.setAttribute("type", "submit");
    submit.setAttribute("id", "editSubmit");

    form.appendChild(tittleInput);
    form.appendChild(contentTextarea);
    form.appendChild(coverFile);
    form.appendChild(oldCover);
    form.appendChild(submit);
    editFormContainer.appendChild(form);

    document.getElementById("editContent").value = post.data().content;
    document.getElementById("oldCover").value = post.data().fileref;

    document.querySelector("#editForm").addEventListener("submit", async(e) => {
        e.preventDefault();

        const postId = await getPostIdFromURL();
        if(document.getElementById("editTittle").value !="" && document.getElementById("editContent").value != ""){
            if(document.getElementById("editCover").files[0] != undefined){
                const cover = document.getElementById("editCover").files[0];
                const storageRef = firebase.storage().ref();
                const storageChild = storageRef.child(cover.name);

                console.log("Updating File.....");

                const postCover = storageChild.put(cover);
                await new Promise((resolve) => {
                    postCover.on("state_changed", (snapshot) => {
                        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(Math.trunc(progress));
    
                        if(progressHandler != null){
                            progressHandler.style.display = true;
                        }
                        if(postSubmit != null){
                            postSubmit.disabled = true;
                        }
                        if(progressBar != null){
                            progressBar.value = progress;
                        }
                    }, (error) => {
                        console.log(error);
                    }, async() => {
                        const downloadURL = await storageChild.getDownloadURL();
                        d = downloadURL;
                        console.log(d);
                        resolve();
                    });
                });

                const fileRef = await firebase.storage().refFromURL(d);
                await storageRef.child(document.getElementById("oldCover").value).delete().catch(err => {
                    console.log(err);
                });
                console.log("Previous image deleted successfully!");

                let post ={
                    tittle: document.getElementById("editTittle").value,
                    content: document.getElementById("editContent").value,
                    cover: d,
                    fileref: fileRef.location.path
                }
                await firebase.firestore().collection("posts").doc(postId).sec(post, {merge: true});
                location.reload();
            }
            else{
                await firebase.firestore().collection("posts").doc(postId).set({
                    tittle: document.getElementById("editTittle").value,
                    content: document.getElementById("editContent").value
                }, {merge: true});
                location.reload();
            }
        }else{
            console.log("You need to fill the inputs!");
        }
    })

}

if(editButton !=null){
    editButton.addEventListener("click", () => {
        if(editMode == false){
            editMode = true;
            console.log("Enabling Edit Mode!");
            appendEditForm();
        }else{
            editMode = false;
            console.log("Disabling Edit Mode!");
            removeEditForm();
        }

    })
}

const removeEditForm = () => {
    let editForm = document.getElementById("editForm");
    editFormContainer.removeChild(editForm);
}

if(createForm != null){
    let d;
    createForm.addEventListener("submit", async(e) => {
        e.preventDefault();

        if(document.getElementById("tittle").value != "" && document.getElementById("content").value !="" && document.getElementById("cover").files[0] !=null){
            let tittle = document.getElementById("tittle").value;
            let content = document.getElementById("content").value;
            let cover = document.getElementById("cover").files[0];

            console.log(cover);

            const storageRef = firebase.storage().ref();
            const storageChild = storageRef.child(cover.name);

            console.log("Your File is Uploading....");
            const postCover = storageChild.put(cover);

            await new Promise((resolve) => {
                postCover.on("state_changed", (snapshot) => {
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(Math.trunc(progress));

                    if(progressHandler != null){
                        progressHandler.style.display = "block";
                    }
                    if(postSubmit != null){
                        postSubmit.disabled = true;
                    }
                    if(progressBar != null){
                        progressBar.value = progress;
                    }
                }, (error) => {
                    console.log(error);
                }, async() => {
                    const downloadURL = await storageChild.getDownloadURL();
                    d = downloadURL;
                    console.log(d);
                    resolve();
                });
            });

            const fileRef = await firebase.storage().refFromURL(d);

            let post ={
                tittle,
                content,
                cover: d,
                fileref: fileRef.location.path
            }

            await firebase.firestore().collection("posts").add(post);
            console.log("Post added SuccessFully!");

            if(postSubmit != null){
                window.location.replace("index.html");
                postSubmit.disabled = false;
            }
        }else{
            console.log("Must fill all the inputs");
        }
    });
}

if(deleteButton !== null){
    deleteButton.addEventListener("click", async() => {
        const postId = getPostIdFromURL();
        let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));
        
        const storageRef = firebase.storage().ref();
        await storageRef.child(post.data().fileref).delete().catch(err => console.log(err));

        await firebase.firestore().collection("posts").doc(postId).delete();

        window.location.replace("index.html");
    });
}

document.addEventListener("DOMContentLoaded", (e) => {
    getPosts();
    getPost();
});

openNav.addEventListener("click", (e) => {
    document.getElementById("nav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
});

closeNav.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("nav").style.width = "0px";
    document.getElementById("main").style.marginLeft = "";
})