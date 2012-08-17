function ModalDialog (container,cancelButtonText, dismissedCallback) {
  this.el = $("<div class='ModalDialog'>");
  this.buttonContainer = $("<div class='ButtonContainer'>").appendTo(this.el);
  this.callback = dismissedCallback;

  var that = this;

  this.cancelButton = $("<div class='Button BlueButton Cancel'>");
  this.cancelButton.append(cancelButtonText ? cancelButtonText : "Ok");
  this.cancelButton.click(function () { that.dismiss(); });
  this.cancelButton.appendTo(this.buttonContainer);

  // Other buttons can be added later.
  this.buttons = [];

  if (!container)
    container = $(document.body);
  container.append(this.el);
  return this;
};

ModalDialog.prototype.dismiss = function () {
  this.el.remove();
  this.callback();
};

ModalDialog.prototype.addButton = function (buttonText, buttonAction) {
  if (!this.buttons.length && this.cancelButton[0].innerHTML === "Ok")
    this.cancelButton[0].innerHTML = "Cancel";

  var button = $("<div class='Button BlueButton'>").append(buttonText).click(buttonAction);
  this.buttons.push(button);
  this.buttonContainer.append(button);
};