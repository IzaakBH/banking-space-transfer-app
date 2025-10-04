# Banking Space Transfer App

My method of managing my budget is maintaining a set of spaces in my banking app (Starling). 
More details on Spaces at Starling [here](https://www.starlingbank.com/features/spaces/)

I currently have to manually transfer money out of spaces for each transaction, else I run the risk of having 
no money in my current account & getting declined at the till!

This app provides an interface which lists valid transactions and spaces and allows you to transfer the exact transfer 
amount between them with a few clicks.

It adds notes on transactions to ensure they dont get shown again (but also has built in idempotency to ensure transfers happen once and only once).

# Security
Tokens are never sent to the server. All processing and calls are done client side.

You should only give your token the minimum scopes, namely...
- account:read
- account-list:read
- transaction:read
- space:read
- transaction:edit
- savings-goal-transfer:create

These will ensure that even if your token goes missing, an attacker can't make payments out of your account.

# Set Up

1) Get a Personal Access Token for your starling account/sandbox account. See the [docs](https://developer.starlingbank.com/).
2) Run the app (Instructions to come)
3) Use the interface, it should be pretty self explanatory.

# Future changes
The next big change is being able to host this somewhere. Ill probably spin up a public instance for people to test, as well
as a private instance for myself.

Make the vite config configurable based on some env var. This will allow the url to be changed by the person using the docker image

UX could be improved by making it clearer the app is loading. 

In theory, this app could be used for any bank that has spaces (i.e. Monzo). It would require some refactors.

The app was also pretty much entirely written by Claude. As such, it doesnt have great coding practices.
There is a lot of room for refactoring to make it nicer.

# Attributions
Favicon by Font Awesome http://fontawesome.com. 