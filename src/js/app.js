
render:  () => {
    var electionInstance;
    var loader = $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    // Load account data
    web3.eth.getCoinbase(function (err, account) {
        if (err === null) {
            App.account = account;
            $('#accountAddress').html('Your Account: ' + account);
        }
    });
    // Load contract data
    App.contracts.Election.deployed().then(function (instance) {
        electionInstance = instance;
        return electionInstance.candidatesCount();
    }).then(function (candidatesCount) {
        var candidatesResults = $('#candidatesResults');
        candidatesResults.empty();
        var candidatesSelect = $('#candidatesSelect');
        candidatesSelect.empty();
        for (var i = 1; i <= candidatesCount; i++) {
            electionInstance.candidates(i).then(function (candidate) {
                var id = candidate[0];
                var name = candidate[1];
                var voteCount = candidate[2];
                // Render candidate Result
                var candidateTemplate = '<tr><th>' + id + '</th><td>' + name + '< /td><td>' + voteCount + '</td></tr>'
                candidatesResults.append(candidateTemplate);
                // Render candidate ballot option
                var candidateOption = '<option value=\'' + id + '\' >' + name + '</option>'
                candidatesSelect.append(candidateOption);
            });
        }
        return electionInstance.voters(App.account);
    }).then(function (hasVoted) {
        // Do not allow a user to vote
        if (hasVoted) {
            $('form').hide();
        }
        loader.hide();
        content.show();
    }).catch(function (error) {
        console.warn(error);
    });
}

castVote:  () => {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
        return instance.vote(candidateId, {from: App.account})
            ;
    }).then(function (result) {
        // Wait for votes to update
        $('#content').hide();
        $('#loader').show();
    }).catch(function (err) {
        console.error(err);
    });
}

listenForEvents:  () => {
    App.contracts.Election.deployed().then(function (instance) {
        instance.votedEvent({}, {
            fromBlock: 0,
            toBlock: 'latest'
        }).watch(function (error,
                           event) {
            console.log('event triggered', event)
            // Reload when a new vote is recorded
            App.render();
        });
    });
}

initContract:  () => {
    $.getJSON('Election.json',
        function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            App.listenForEvents();
            return App.render();
        });
}

