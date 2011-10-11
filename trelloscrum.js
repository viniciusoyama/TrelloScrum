/*
** TrelloScrum v0.3 - https://github.com/Q42/TrelloScrum
** Adds Scrum to your Trello
**
** Orig:
** Jasper Kaizer <https://github.com/jkaizer>
** Marcel Duin <https://github.com/marcelduin>
**
** Contribs:
** Paul Lofte <https://github.com/paullofte>
** Nic Pottier <https://github.com/nicpottier>
**
** Changelog:
**
** v0.3
** - Now event-driven, much faster response
** - JS rewrite
** - Small bugfixes
**
** v0.2
** - Includes decimal story points
** - Filtered cards aren't added to list totals
** - Question mark accepted as story points
** - Fancier storypoint display
**
** v0.1
** - Initial release
**
**
*/

var filtered=false;

$(function(){
	//watch filtering
	$('.js-filter-cards').live('DOMSubtreeModified',function(){
		filtered=$('.js-filter-cards').hasClass('is-on');
		calcPoints()
	});

	//want: trello events
	(function periodical(){
		$('.list').each(list);
		$('.list-card').each(listCard);
		showPointPicker();
		setTimeout(periodical,1000)
	})()
});

//.list pseudo
function list(e){
	if(this.list)return;
	this.list=true;

	var $list=$(this);
	var $total=$('<span class="list-total">')
		.appendTo($list.find('.list-header h2'));

	this.calc = function(){
		var score=0;
		$list.find('.list-card').each(function(){if(!isNaN(Number(this.points)))score+=Number(this.points)});
		$total.text(score>0?score:'')
	}
};

//.list-card pseudo
function listCard(e){
	if(this.listCard)return;
	this.listCard=true;

	var points=-1,
		that=this,
		$card=$(this),
		$badge=$('<span class="badge badge-points point-count">');

	if($card.hasClass('placeholder'))return;

	$card.bind('DOMNodeInserted',function(e){
		if(e.target==that&&$card.closest('.list')[0])getPoints()
	});

	function getPoints(){
		var $title=$card.find('.list-card-title a');
		var title=$title.text();
		points=($title[0].otitle||title).replace(/^.*\((\?|\d*\.?\d+)\).*$/,'$1');
		if(points!=title)$title[0].otitle=title;
		$title.text($title.text().replace(/\((\?|\d*\.?\d+)\)\s?/,''));
		if($card.parent()[0])$badge.text(that.points).insertBefore($card.find('.badges').first());
		calcPoints()
	};

	this.__defineGetter__('points',function(){
		//don't add to total when filtered out
		//also accept question mark
		return (!filtered||$card.css('opacity')==1)&&(points>=0||points=='?')?points:''
	});

	getPoints()
};


//forcibly calculate list totals
function calcPoints(){
	$('.list').each(function(){if(this.calc)this.calc()})
};

var _pointSeq = [1, 2, 3, 5, 8, 13, 20];

function showPointPicker() {
	if ($(".card-detail-title .edit-controls").length > 0  && $(".card-detail-title .edit-controls .picker").length == 0){
		var pickers = '<span class="point-value">?</span> ';
		for (var i=0; i < _pointSeq.length; i++)
			pickers += '<span class="point-value">' + _pointSeq[i] + '</span> ';
    	
    	var picker = "<div class='picker'>" + pickers + "</div>";
		$(".card-detail-title .edit-controls").append(picker);
		$(".point-value").click(updatePoint);
    }
}

function updatePoint(){
    var value = $(this).text();
    var text = $(".card-detail-title .edit textarea").val();
    $(".card-detail-title .edit textarea").remove();

    // replace our new 
    if (text.match(/^.*\((\?|\d*\.?\d+)\).*$/)) {
    	text = text.replace(/\((\?|\d*\.?\d+)\)/, '('+value+')');
    } else {
    	text = '('+value+') ' + text;
    }
		
 
    // total hackery to get Trello to acknowledge our new value
    $(".card-detail-title .edit").prepend('<textarea type="text" class="field single-line" style="height: 42px; ">' + text + '</textarea>');

    // then click our button so it all gets saved away
    $(".card-detail-title .edit .js-save-edit").click();
    calcPoints();
}

