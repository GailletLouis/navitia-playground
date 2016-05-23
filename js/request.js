function makeDeleteButton() {
    return $('<button/>')
        .addClass('delete')
        .click(function() { $(this).closest('.toDelete').remove(); updateUrl(this); })
        .text('x');
}

function insertRoute(val) {
    var currentRouteValue = $('.route', $(val).parent()).val();
    $(val).after(makeRoute('', currentRouteValue));
}

function makeRoute(val, currentRouteValue) {
    var input = $('<input/>').focus(function(){ routeValOnFocus(this); })
                             .keyup(function(){ updateUrl(this); })
                             .attr('type', 'text')
                             .addClass('route');
    if (currentRouteValue == 'coverage') {
        var res = $('<span/>')
        .addClass('toDelete')
        .addClass('routeElt')
        .append(' ')
        .append($('<span/>')
                .addClass('pathElt')
                .append(input)
                .append(makeDeleteButton()))
        .append('<button class="add" onclick="insertRoute(this)">+</button>')
        makeCoverageList(val, input);
        return res;
    } else {
        return $('<span/>')
        .addClass('toDelete')
        .addClass('routeElt')
        .append(' ')
        .append($('<span/>')
                .addClass('pathElt')
                .append($('<input/>')
                        .attr({type: 'text',
                               onfocus: 'updateUrl(this)',
                               onkeyup: 'updateUrl(this)'})
                        .addClass('route')
                        .val(val))
                .append(makeDeleteButton()))
        .append('<button class="add" onclick="insertRoute(this)">+</button>')
    }
}

function routeValOnFocus(valInput) {
    var cov = $('.route', $(valInput).parent().parent().prev()).val();

    if (cov == 'coverage' && ! $(valInput).attr('class').contains('route ui-autocomplete-input')) {
        makeCoverageList($(valInput).val(), valInput);
    } else if (cov != 'coverage' && $(valInput).attr('class').contains('route ui-autocomplete-input')) {
        var valueElt = $('<input/>').addClass('route')
                                    .attr('type', 'text')
                                    .val($(valInput).val())
                                    .focus(function(){ routeValOnFocus(this); })
                                    .keyup(function(){ updateUrl(this); });
        $(valInput).replaceWith(valueElt);
        valueElt.focus();
        valInput = valueElt;
    }
    updateUrl(valInput);
}

function makeParam(key, val) {
    var res = $('<span/>')
        .addClass('param')
        .addClass('toDelete')
        .append(' ');

    res.append($('<input/>')
        .attr('type', 'text')
        .addClass('key')
        .val(key)
        .focus(function(){ updateUrl(this); })
        .keyup(function(){ updateUrl(this); }));

    var valueElt = $('<input/>')
         .attr('type', 'text')
        .addClass('value')
        .val(val)
        .focus(function(){ paramsValOnFocus(this); })
        .keyup(function(){ updateUrl(this); });

    if (isPlaceType(key)) {
        makeAutocomplete(valueElt);
    }else if (isDatetimeType(key)) {
        makeDatetime(valueElt);
    }
    res.append(valueElt);
    res.append(makeDeleteButton());
    return res;
}

function paramsValOnFocus(valInput){
    var key = $(valInput).prev().val();

    if (isPlaceType(key)) {
        makeAutocomplete(valInput);
    }else if (isDatetimeType(key)) {
        makeDatetime(valInput);
    } else if (isAutoCompleteInput($(valInput)) ||
               isDatePicker($(valInput))) {

        var newElt = $('<input/>')
            .addClass('value')
            .attr('type', 'text')
            .val($(valInput).val())
            .keyup(function(){ updateUrl(this); })
            .focus(function(){ paramsValOnFocus(this); });
        $(valInput).replaceWith(newElt);
        newElt.focus();
        valInput = newElt;
    }
    updateUrl(valInput);
}
function insertParam() {
    $("#parameterList").append(makeParam('', ''));
}

function getFocusedElemValue(elemToTest, focusedElem, noEncoding) {
    if (focusedElem == elemToTest) {
        return '<span class="focus_params" style="color:red">{0}</span>'
            .format(noEncoding ? elemToTest.value : elemToTest.value.encodeURI());
    }
    return noEncoding ? elemToTest.value : elemToTest.value.encodeURI();
}

function makeCoverageList(val, obj) {
    var api = $("#api input.api").attr('value');
    var token = $('#token input.token').val();
    var request =  api + "/coverage";
    
    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token) },
        dataType: "json",
        url: request,
        success: function(data) {
                var res = [];
                for (var dict in data) {
                    for (var cov = 0; cov < data[dict].length; cov++) {
                        res.push(data[dict][cov].id);
                    }
                    if (val) { $(obj).val(val); }
                    var auto = $(obj).autocomplete({source: res, minLength: 0, scroll: true, delay: 500});
                    auto.focus(function() {
                        auto.autocomplete("search", '');
                    });
                    return auto;
                }
            }
    });
}

function finalUrl(focusedElem) {
    var finalUrl = getFocusedElemValue($('#api input.api')[0], focusedElem, true);
    $("#route input.route").each(function(){
        finalUrl += '/' + getFocusedElemValue(this, focusedElem);
    });

    finalUrl += '?';

    $('#parameters input.key, #parameters input.value').each(function(){
        finalUrl += getFocusedElemValue(this, focusedElem);
        if ($(this).hasClass('key')) {
            finalUrl += '=';
        }
        if ($(this).hasClass('value')) {
            finalUrl += '&';
        }
    });
    return finalUrl;
}

function submit() {
    var token = $('#token input.token').val();
    var f = finalUrl(); // finalUrl can be called without any args
    window.location = '?request={0}&token={1}'.format(f.encodeURI(), token.encodeURI());
}

function updateUrl(focusedElem) {
    var f = finalUrl(focusedElem);
    $('#urlDynamic span').html(f);
}

function getCoverage() {
    var prevIsCoverage = false;
    var coverage = null;
    var covElt = $("#route input.route").each(function() {
        if (prevIsCoverage) {
            coverage = $(this).val();
        }
        prevIsCoverage = $(this).val() == 'coverage';
    });
    return coverage;
}

function makeAutocomplete(elt) {
    $(elt).autocomplete({
        source: function(request, response) {

            var token = $('#token input.token').val();
            var url = $('#api input.api').val();
            var cov = getCoverage();
            if (cov !== null) {
                url = '{0}/coverage/{1}'.format(url, cov);
            }
            $.ajax({
                url: '{0}/places?q={1}'.format(url, request.term.encodeURI()),
                headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token) },
                success: function(data) {
                    var res = [];
                    if ('places' in data) {
                        data['places'].forEach(function(place) {
                            res.push({ value: place.id, label: place.name });
                        });
                    }
                    response(res);
                },
                error: function() {
                    response([]);
                }
            });
        },
    });
}

function makeDatetime(elt) {
    $(elt).datetimepicker({
        dateFormat: 'yymmdd',
        timeFormat: 'HHmmss',
        timeInput: true,
        separator: 'T',
        controlType: 'select',
        oneLine: true,
    });
}

$(document).ready(function() {
    var search = new URI(window.location).search(true);
    var token = search['token'];
    if (isUndefined(token)) { token = ''; }
    $("#token input.token").attr('value', token);
    $("#urlFormToken").attr('value', token);

    var request = search['request'];
    if (isUndefined(request)) { return; }

    var req_uri = new URI(request);
    var origin = req_uri.origin();
    var paths = req_uri.path().split('/');
    // The first element after a split is an empty string("")
    if (paths.length == 1) { return; }
    var api = origin;

    var vxxFound = false;
    paths.slice(1).forEach(function(r) {
        if (!r) { return; }
        if (vxxFound) {
            var currentRouteValue = $('#route span .route').last().val();
            $("#route").append(makeRoute(r.decodeURI(), currentRouteValue));
        } else {
            api = api + '/' + r.decodeURI();
            vxxFound = /^v\d+$/.test(r);
            $("#api input.api").attr('value', api);
        }
    })

    var params = req_uri.search(true);

    if (! isUndefined(params)) {
        var param_elt = $("#parameterList");
        for (var key in params) {
            var value = params[key];
            // a list of params, ex.: forbidded_uris[]
            if (Array.isArray(value)) {
                value.forEach(function(v){
                param_elt.append(makeParam(key.decodeURI(), v.decodeURI()));
                });
            } else {
                param_elt.append(makeParam(key.decodeURI(), params[key]));
            }
        }
    }
    $('#urlDynamic span').html(request);
});
