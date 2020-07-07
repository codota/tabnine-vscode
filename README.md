## **TabNine for Visual Studio Code**


### **TabNine Overview**
___

This is the VS Code client for [TabNine](https://tabnine.com), the all-language autocompleter.

- Indexes your whole project, reading your `.gitignore` to determine which files to index.
- Type long variable names in just a few keystrokes using the mnemonic completion engine.
- Zero configuration. TabNine works out of the box.
- Highly responsive: typically produces a list of suggestions in less than 10 milliseconds.

Many users choose to disable the default behavior of using Enter to accept completions, 
to avoid accepting a completion when they intended to start a new line. 
You can do this by going to Settings → Editor: Accept Suggestion On Enter 
and setting it to off.

<img src="./tabnine.gif" height="300" />

### **Deep Completion**
___

Deep TabNine is trained on around 2 million files from GitHub. During training, its goal is to predict each token given the tokens that come before it. To achieve this goal, it learns complex behaviour, such as type inference in dynamically typed languages.

Deep TabNine can use subtle clues that are difficult for traditional tools to access. For example, the return type of `app.get_user()`is assumed to be an object with setter methods, while the return type of `app.get_users()` is assumed to be a list.

Deep TabNine is based on GPT-2, which uses the Transformer network architecture. This architecture was first developed to solve problems in natural language processing. Although modelling code and modelling natural language might appear to be unrelated tasks, modelling code requires understanding English in some unexpected ways. 

### **Deep TabNine Cloud**
___
Deep TabNine requires a lot of computing power: running the model on a laptop would not deliver the low latency that TabNine’s users have come to expect. So we are offering a service that will allow you to use TabNine’s servers for GPU-accelerated autocompletion. It’s called TabNine Cloud, it’s currently in beta, and you can sign up for it here.

We understand that many users want to keep their code on their own machine for privacy reasons. We’re taking the following steps to address this use case:

For individual developers, we are working on a reduced-size model which can run on a laptop with reasonable latency. Update: we’ve released TabNine Local.

For enterprises, we will offer the option to license the model from us and run it on your own hardware. We can also train a custom model for you which understands the unique patterns and style within your codebase. If this sounds interesting to you, we would love to hear more about your use case at enterprise@tabnine.com.

Enabling TabNine Cloud sends small parts of your code to our servers to provide GPU-accelerated completions.Other than for the purpose of fulfilling your query, your data isn’t used, saved or logged in any way.

**[You can enable Deep Cloud by signup TabNine Professional](https://www.tabnine.com/trial/)**

**[You can read more about Deep Completion](https://www.tabnine.com/blog/deep)**

## **Frequently Asked Questions**
___
<details><summary>Why do you say TabNine is “simple”?</summary>
<p>TabNine works for all programming languages.TabNine does not require any configuration in order to work.TabNine does not require any external software (though it can integrate with it).Since TabNine does not parse your code, it will never stop working because of a mismatched bracket.
</p>
</details>

<details><summary>Is there a risk that TabNine will leak my source code?</summary>
<p>By default, TabNine makes web requests only for the purposes of downloading updates and validating registration keys. In this case your code is not sent anywhere, even to TabNine servers.

You may opt in to TabNine Cloud, which allows you to use TabNine’s servers for GPU-accelerated completions powered by a deep learning model. If sending code to a cloud service is not possible, we also offer a self-hosted option. Contact us at enterprise@tabnine.com.
</p>
</details>

<!-- 
- Indexes your whole project, reading your .gitignore to determine which files to index.
- Type long variable names in just a few keystrokes using the mnemonic completion engine.
- Zero configuration. TabNine works out of the box.
- Highly responsive: typically produces a list of suggestions in less than 10 milliseconds.

Many users choose to disable the default behavior of using Enter to accept completions, to avoid accepting a completion when they intended to start a new line. You can do this by going to _Settings → Editor: Accept Suggestion On Enter_ and setting it to _off_. -->
## **License**
___
This repo includes source code as well as packaged TabNine binaries. The MIT license only applies to the source code, not the binaries.  The binaries are covered by the [TabNine End User License Agreement](https://tabnine.com/eula).
