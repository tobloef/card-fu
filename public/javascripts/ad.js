$(".close-banner").click(function () {
	$(".banner").addClass("slideup");
	console.log("close");
    Cookies.set("hide-banner", true, { expires: 7 });
});

$(".banner-text").click(function(){
	window.open("https://m.do.co/c/a92261ae10d2");
})

if (!Cookies.get("hide-banner")) {
	$(".banner").css("max-height", "40px");
}
