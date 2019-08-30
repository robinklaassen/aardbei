(function () {

var arr = window.location.search.split('id=');
var id = (arr.length > 1) ? arr[1] : '0';

// GET the starting data: camp, members, participants and courses
$.get('start.php', { id: id }, function(data) {
	var x = JSON.parse(data);
	
	// Define the Knockout view model
	function ViewModel() {
		var self = this;
		
		// Pass starting data to view model
		for (var k in x) {self[k] = x[k];}
		
		self.scheduleView = ko.observable(true);
		self.isCurrent = ko.observable(false);
		
		// Filter function for covered courses
		self.coveredCourses = function(member_id) {
			var y = _.findWhere(x.members, {id: member_id});
			var course_ids = _.pluck(y.coverage,'id');
			var theseCourses = _.filter(self.courseArray, function(obj) {
				return _.contains(course_ids, obj.id);
			});
			return theseCourses;
		};
		
		// Initialize blocksArray
		try {
			var tmpBA = JSON.parse(localStorage.blocksArray);
		} catch (err) {
			var tmpBA = [1,2,3,4];
		}
		self.blocksArray = ko.observableArray(tmpBA, {persist: "blocksArray"});
		
		// Initialize inSchedule
		self.inSchedule = {};
		_.each(x.members, function(val,key) {
			try {
				var tmp = JSON.parse(localStorage.inSchedule[val.id]);
			} catch (err) {
				var tmp = '1';
			}
			self.inSchedule[val.id] = ko.observable(tmp, {persist: "inSchedule["+val.id+"]"});
		});
		
		// Initialize claimedCourse
		self.claimedCourse = {};
		_.each(x.members, function(val,key) {
			try {
				var tmp = JSON.parse(localStorage.claimedCourse[val.id]);
			} catch (err) {
				var tmp = null;
			}
			self.claimedCourse[val.id] = ko.observable(tmp, {persist: "claimedCourse["+val.id+"]"})
		});
		
		// Initialize courseInput
		self.courseInput = {};
		_.each([1,2,3,4,5,6], function(blockNum) {
			self.courseInput[blockNum] = {};
			_.each(x.participants, function(val,key) {
				try {
					var tmp = JSON.parse(localStorage.courseInput[blockNum][val.id]);
				} catch (err) {
					var tmp = null;
				}
				self.courseInput[blockNum][val.id] = ko.observable(tmp, {persist: "courseInput["+blockNum+"]["+val.id+"]"});
			});
		});
		
		// Initialize schedule and memberClass
		self.schedule = {}; self.memberClass = {};
		_.each([1,2,3,4,5,6], function (blockID) {
			self.schedule[blockID] = {}; self.memberClass[blockID] = {};
			_.each(x.members, function (val,key) {
				try {
					var tmp = JSON.parse(localStorage.schedule[blockID][val.id]);
				} catch (err) {
					var tmp = [];
				}
				self.schedule[blockID][val.id] = ko.observableArray(tmp, {persist: "schedule["+blockID+"]["+val.id+"]"});
				try {
					var tmp = JSON.parse(localStorage.memberClass[blockID][val.id]);
				} catch (err) {
					var tmp = '';
				}
				self.memberClass[blockID][val.id] = ko.observable(tmp, {persist: "memberClass["+blockID+"]["+val.id+"]"});
			});
			try {
				var tmp = JSON.parse(localStorage.schedule[blockID]['0']);
			} catch (err) {
				var tmp = [];
			}
			self.schedule[blockID]['0'] = ko.observableArray(tmp, {persist: "schedule["+blockID+"]['0']"});
		});
		
		// Initialize altSchedule
		self.altSchedule = {};
		_.each(x.participants, function (participant) {
			self.altSchedule[participant.id] = {};
			_.each([1,2,3,4,5,6], function (blockID) {
				try {
					var tmp = JSON.parse(localStorage.altSchedule[participant.id][blockID]);
				} catch (err) {
					var tmp = '';
				}
				self.altSchedule[participant.id][blockID] = ko.observable(tmp, {persist: "altSchedule["+participant.id+"]["+blockID+"]"});
			});
		});
		
		// Compute membersInSchedule
		self.membersInSchedule = ko.computed(function() {
			var mis = _.filter(x.members, function(member) {
				return self.inSchedule[member.id]() != 0;
			});
			return _.pluck(mis, 'id');
		});
		
		// Compute participantsWithInput
		self.participantsWithInput = ko.computed(function() {
			var pwi = _.filter(x.participants, function(participant) {
				var status = false;
				_.each(self.blocksArray(), function (blockID) {
					if (self.courseInput[blockID][participant.id]()) {status = true}
				});
				return status;
			});
			return _.pluck(pwi, 'id');
		});
		
		// Validate claimed courses (no multiples allowed)
		self.multipleClaimed = function (member_id) {
			var myCourse = self.claimedCourse[member_id]();
			var counter = 0;
			_.each(self.claimedCourse, function (course) {
				if (myCourse != undefined && course() == myCourse) { counter++ };
			});
			
			return (counter > 1) ? true : false ;
		};
		
		// Returner functions
		self.getName = function (id, type, length) {
			var y = _.findWhere(x[type], {id: id});
			if (length == 'short') { return y.firstName } else { return y.fullName };
		};
		self.getLevel = function (id) {
			var y = _.findWhere(x.participants, {id: id});
			return y.level + ' ' + y.levelType;
		};
		self.getHClass = function (blockID, memberID) {
			return "text-center m"+blockID+" "+self.memberClass[blockID][memberID](); 
		};
		
		// UI functions
		self.clearCache = function () {
			var r = confirm("Je staat op het punt om alle invoer (inclusief de lokale opslag) te wissen. Wil je doorgaan?");
			if (r) {
				localStorage.clear();
				location.reload();
			}
		};
		self.lessBlocks = function () {
			var tmp = self.blocksArray();
			if (tmp.length > 1) {
				tmp.pop();
				self.blocksArray(tmp);
			}
		};
		self.moreBlocks = function () {
			var tmp = self.blocksArray();
			if (tmp.length < 6) {
				tmp.push(tmp.length+1);
				self.blocksArray(tmp);
			}
		};
		self.toggleSchedule = function () {
			self.scheduleView(!self.scheduleView());
		};
		
		// Schedule creation
		self.makeSchedule = function () {
			// Reset schedule and memberClass
			_.each([1,2,3,4,5,6], function (blockID) {
				_.each(self.members, function (val,key) {
					self.schedule[blockID][val.id]([]);
					self.memberClass[blockID][val.id]('');
				});
				self.schedule[blockID]['0']([]);
				//alert(JSON.stringify(self.members));
			});
			
			// First create 'possib': an object that gives the possible members for each participant's filled out block
			var possib = {};
			var numPossib = {};
			_.each(self.blocksArray(), function (blockID) {
				var coursesObj = self.courseInput[blockID];
				possib[blockID] = {};
				numPossib[blockID] = [];
				
				_.each(coursesObj, function (courseID, partID) {
					if (courseID()) { // only entered courses
						var participant = _.findWhere(self.participants, {id: partID});
						var pl = participant.level;
						var possibCounter = 0;
						
						_.each(self.members, function (member) {
							var y = _.findWhere(member.coverage, {id: courseID()});
							var ml = ( y !== undefined ? y.level : 0);
							
							if (self.inSchedule[member.id]() == '1' && ml >= pl) {
								if (possib[blockID][partID] === undefined) { possib[blockID][partID] = [] }
								possib[blockID][partID].push(member.id);
								possibCounter++;
								
								theValue = self.memberClass[blockID][member.id]();
								self.memberClass[blockID][member.id](theValue+'p'+partID+' ');
								
								//memberClass[blockID][member.id] += 'p'+partID+' ';
								
							}	
						});
						
						numPossib[blockID].push({id: partID, num: possibCounter});
						
					}
				});
			});
			
			// Then, for each block, assign participants to members in order of least possibilities, keeping in mind claims and a max of three participants per member
			_.each(self.blocksArray(), function (blockID) {
				numPossib[blockID] = _.sortBy(numPossib[blockID], 'num');
				var fullMembers = [];
				
				// Foreach in the ordered numPossib
				_.each(numPossib[blockID], function (numObj) {
					var partID = numObj.id;
					var newPossib = _.difference(possib[blockID][partID], fullMembers);
					
					if (newPossib.length==0) {
						// Assign to unplaced
						self.schedule[blockID]['0'].push(partID);
					} else {
						// Check if course is claimed
						var courseID = self.courseInput[blockID][partID]();
						var claimedID = findKey(self.claimedCourse,courseID);
						
						// If claimed and member is in newPossib (has coverage and is not full yet), assign. Else pick random member from newPossib
						if (claimedID !== undefined && _.contains(newPossib,claimedID)) {
							var chosen = claimedID;
						} else {
							var chosen = newPossib[Math.floor(Math.random() * newPossib.length)];
						}
						
						self.schedule[blockID][chosen].push(partID);
						
						// Check if chosen member is now full
						if (self.schedule[blockID][chosen]().length==3) {
							fullMembers.push(chosen);
						}
					}
				});
				
			});
			
			self.constructView();
			self.isCurrent(false);
		};
		
		// Alternate schedule builder
		ko.watch(self.schedule, {depth: -1}, function (parents, child, item) {
			// Some HTML removal first as Knockout and jQuery don't always play along
			$('[role=tooltip].bottom').remove();
			$('h3').removeClass('bg-success');
			
			// Reset altSchedule
			_.each(self.participants, function (participant) {
				_.each([1,2,3,4,5,6], function (blockID) {
					self.altSchedule[participant.id][blockID]('');
				});
			});
			
			// Fill alternative schedule
			_.each(self.schedule, function (schedObj, blockID) {
				_.each(schedObj, function (participantList, memberID) {
					_.each(participantList(), function (partID) {
						self.altSchedule[partID][blockID](memberID);
					});
				});
			});
		});
		
		// Watch input change for display of 'schedule changed' message
		ko.watch(self.inSchedule, {depth: -1}, function () {self.isCurrent(true)});
		ko.watch(self.claimedCourse, {depth: -1}, function () {self.isCurrent(true)});
		ko.watch(self.courseInput, {depth: -1}, function () {self.isCurrent(true)});
		
		// View construction after schedule creation
		self.constructView = function () {

			// (Re)set Bootstrap tooltips
			$('[data-toggle="tooltip"]').tooltip();
			
			// Enables highlighting of possible members
			$('.list-group-item').hover(
			function () {
				var tmp = $(this).attr('id').split('-'); // tmp[1] is partID and tmp[2] is blockID
				$('.m'+tmp[2]+'.p'+tmp[1]).addClass('bg-success');
			},
			function () {
				var tmp = $(this).attr('id').split('-');
				$('.p'+tmp[1]+'.m'+tmp[2]).removeClass('bg-success');
			});

		};
		
	};
		
	var z = new ViewModel();

	// Set the sortable options
	ko.bindingHandlers.sortable.options = {
		placeholder: 'list-group-item',
		tolerance: 'pointer',
		cursor: 'move'
	};
	ko.bindingHandlers.sortable.afterMove = function (arg) {
		z.constructView();
	};
	
	// Apply the Knockout bindings
	ko.applyBindings(z);
	
	z.isCurrent(false);
	
	// Perform constructView() once (enables tooltips and member highlighting)
	z.constructView();
	
	// Enables popovers
	$('[data-toggle="popover"]').popover();
	
	// Disables selection on icons
	$('.fa').disableSelection();
});

// Helper function to find a key with a certain value
// NOTE: in an object of KO observables!
function findKey(obj, value) {
  var key;

  _.each(obj, function (v, k) {
    if (v() === value) {
      key = k;
    }
  });

  return key;
}

// GUI function for highlighting table rows on click (as a single toggle)
$('#root').on('click', 'tr.highlightable', function() {
	$(this).toggleClass('highlighted');
});

// GUI function for highlighting participant cells on double click
$('#root').on('dblclick', 'li.list-group-item', function() {
	$(this).toggleClass('locked');
});

}());