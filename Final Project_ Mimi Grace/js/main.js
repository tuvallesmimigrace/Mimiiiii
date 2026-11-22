$(function ()
{
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && $.fn.ripples)
    {
        try
        {
            $(".slider").ripples({
                resolution: 256,
                dropRadius: 20,
                perturbance: 0.03,
                interactive: true
            });
        }
        catch (e) {}
    }

    if ($.fn.typed) $(".text").typed({
        strings:
        [
            "Welcome to <strong class='primary'>Mims Web</strong>",
            "We build <strong class='primary'>websites</strong> that work"
        ],
        typeSpeed: 30,
        backSpeed: 25,
        startDelay: 600,
        backDelay: 2200,
        loop: true,
        showCursor: true
    });

    var $nav = $("#nav");
    var $toTop = $(".back-to-top");

    function onScroll()
    {
        var y = $(window).scrollTop();
        var scrolled = y > 60;

        $nav.toggleClass("secondary", scrolled).toggleClass("transparent", !scrolled);
        $toTop.toggleClass("show", y > $(window).height() * 0.8);
    }

    $(window).on("scroll", onScroll);
    onScroll();

    $("#navi a").on("click", function ()
    {
        if ($(".navbar-toggle").is(":visible"))
        {
            $("#navi").collapse("hide");
        }
    });

    if ($.fn.owlCarousel) $("#team-members").owlCarousel({
        margin: 30,
        loop: true,
        nav: true,
        dots: true,
        autoplay: !reduceMotion,
        autoplayTimeout: 4000,
        autoplayHoverPause: true,
        smartSpeed: 700,
        navText:
        [
            '<i class="fa fa-chevron-left" aria-hidden="true"></i>',
            '<i class="fa fa-chevron-right" aria-hidden="true"></i>'
        ],
        responsive:
        {
            0:   { items: 1 },
            600: { items: 2 },
            992: { items: 3 }
        }
    });

    function animateCounter(el)
    {
        var $el = $(el);
        var target = parseInt($el.data("target"), 10) || 0;

        if (reduceMotion) { $el.text(target.toLocaleString()); return; }

        $({ n: 0 }).animate({ n: target }, {
            duration: 1800,
            easing: "swing",
            step: function (now) { $el.text(Math.floor(now).toLocaleString()); },
            complete: function () { $el.text(target.toLocaleString()); }
        });
    }

    if ("IntersectionObserver" in window)
    {
        var revealObserver = new IntersectionObserver(function (entries)
        {
            entries.forEach(function (entry)
            {
                if (!entry.isIntersecting) return;

                var el = entry.target;
                var delay = parseInt(el.getAttribute("data-delay"), 10) || 0;

                setTimeout(function () { el.classList.add("visible"); }, delay);
                revealObserver.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        $(".reveal").each(function () { revealObserver.observe(this); });

        var counterObserver = new IntersectionObserver(function (entries)
        {
            entries.forEach(function (entry)
            {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        $(".counter").each(function ()
        {
            $(this).text("0");
            counterObserver.observe(this);
        });
    }
    else
    {
        $(".reveal").addClass("visible");
    }

    var $lb = $("#lightbox");
    var $lbImg = $lb.find("img");
    var $items = $(".gallery .img-wrapper");
    var current = 0;
    var lastFocus = null;

    function showImage(i)
    {
        current = (i + $items.length) % $items.length;
        var $a = $items.eq(current);
        $lbImg.attr({ src: $a.attr("href"), alt: $a.attr("title") || "" });
    }

    function openLightbox(i)
    {
        lastFocus = document.activeElement;
        showImage(i);
        $lb.prop("hidden", false);
        $("body").css("overflow", "hidden");
        $lb.find(".lb-close").trigger("focus");
    }

    function closeLightbox()
    {
        $lb.prop("hidden", true);
        $("body").css("overflow", "");
        if (lastFocus) lastFocus.focus();
    }

    $items.on("click", function (e)
    {
        e.preventDefault();
        openLightbox($items.index(this));
    });

    $lb.on("click", ".lb-close", closeLightbox);
    $lb.on("click", ".lb-prev", function () { showImage(current - 1); });
    $lb.on("click", ".lb-next", function () { showImage(current + 1); });
    $lb.on("click", function (e) { if (e.target === this) closeLightbox(); });

    $(document).on("keydown", function (e)
    {
        if ($lb.prop("hidden")) return;
        if (e.key === "Escape")     closeLightbox();
        if (e.key === "ArrowLeft")  showImage(current - 1);
        if (e.key === "ArrowRight") showImage(current + 1);
    });

    var $form = $("#contactform");
    var $alert = $("#form-alert");

    function showAlert(type, text)
    {
        $alert.removeClass("error success").addClass(type).text(text);
    }

    $form.on("submit", function (e)
    {
        e.preventDefault();

        var missing = [];
        var emailOk = true;

        $form.find("[required]").each(function ()
        {
            var $f = $(this);
            var val = $.trim($f.val());
            var bad = !val;

            if ($f.attr("type") === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
            {
                bad = true;
                emailOk = false;
            }

            $f.toggleClass("invalid", bad).attr("aria-invalid", bad ? "true" : null);
            if (bad) missing.push($f);
        });

        if (missing.length)
        {
            showAlert("error", emailOk ? "Please fill in all fields before sending." : "Please enter a valid email address.");
            missing[0].trigger("focus");
            return;
        }

        var $btn = $form.find(".btnn");
        var btnHtml = $btn.html();

        $btn.prop("disabled", true).html('<i class="fa fa-spinner fa-spin"></i> Sending&hellip;');
        $alert.removeClass("error success").text("");

        $.ajax({
            url: $form.attr("action"),
            method: "POST",
            data: $form.serialize(),
            dataType: "json",
            timeout: 15000
        })
        .done(function (res)
        {
            if (res && res.ok)
            {
                showAlert("success", res.message);
                $form[0].reset();
                $btn.addClass("sent").html('<i class="fa fa-check"></i> Message Sent');
                setTimeout(function () { $btn.removeClass("sent").prop("disabled", false).html(btnHtml); }, 4000);
            }
            else
            {
                showAlert("error", (res && res.message) || "Something went wrong. Please try again.");
                $btn.prop("disabled", false).html(btnHtml);
            }
        })
        .fail(function (xhr)
        {
            var msg = xhr.responseJSON && xhr.responseJSON.message;
            showAlert("error", msg || "We couldn't send your message right now. Please email us at info@tuvalles.mimigrace10.com.");
            $btn.prop("disabled", false).html(btnHtml);
        });
    });

    $form.on("input", ".form-control", function ()
    {
        if ($.trim($(this).val())) $(this).removeClass("invalid").removeAttr("aria-invalid");
    });

    var sent = /[?&]sent=([01])/.exec(window.location.search);
    if (sent)
    {
        showAlert(sent[1] === "1" ? "success" : "error",
                  sent[1] === "1" ? "Thanks! Your message has been sent." : "Sorry, your message could not be sent.");
    }

    var $welcome = $("#welcome");

    function closeWelcome()
    {
        $welcome.addClass("hide").attr("aria-hidden", "true");
        $("body").removeClass("welcome-open");
    }

    var song = document.getElementById("song");

    if ($welcome.length)
    {
        $("body").addClass("welcome-open");
        $("#welcome-btn").trigger("focus").on("click", function ()
        {
            if (song && song.paused) song.play().catch(function () {});
            closeWelcome();
        });
    }
    if (song)
    {
        // The play button is a link that opens Spotify in a new tab, so this
        // page stays open and its background music keeps playing.
        // If the music hasn't started yet, this click starts it.
        $("#play-btn").on("click", function ()
        {
            if (song.paused) song.play().catch(function () {});
        });

        // Background music: try to start right away. If the browser blocks it,
        // the welcome screen's tap counts as the click browsers require.
        var auto = song.play();
        if (auto && auto.then)
        {
            auto.then(closeWelcome).catch(function () {});
        }
    }

    $("#year").text(new Date().getFullYear());
});
