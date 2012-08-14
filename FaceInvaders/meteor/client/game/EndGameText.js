var endGameTextAnimationDurations = {
  "Lose": {
    EndText: 0.5,
    Left: 0.5,
    Right: 0.5,
    Restart: 1,
  },
  "Win": {

  }
}

function createEndGameText (game, leftText, rightText, animationCallback) {
  var container = $("<div class='Container'>");
  var state = game.winOrLose;

  var left = $("<div class='Left'>");
  left.append(leftText);
  var right = $("<div class='Right'>");
  right.append(rightText);
  container.append(left, right);

  var endText = $("<div class='EndText'>");
  endText.addClass(state);
  endText.append(container);

  function queueAnimation(el, duration, delay) {
    el.css({
      "-webkit-animation-duration": duration + "s",
      "-webkit-animation-delay": delay + "s",
    });
    return duration + delay;
  }

  var delay = queueAnimation(endText, endGameTextAnimationDurations[state].EndText, 0);
  delay = queueAnimation(left, endGameTextAnimationDurations[state].Left, delay);
  delay = queueAnimation(right, endGameTextAnimationDurations[state].Right, delay);

  if (state === "Lose") {
    var retry = $("<div class='Restart'>Retry?</div>");
    container.append(retry);
    delay = queueAnimation(retry, endGameTextAnimationDurations[state].Restart, delay);

  } else {

  }
  
  game.el.append(endText);
  setTimeout(animationCallback, delay * 1000);

  return endText;
}