package libkb

import (
	"sync"

	keybase1 "github.com/keybase/client/go/protocol/keybase1"
)

type IdentifyDispatchMsg struct {
	Target keybase1.UID
}

type IdentifyDispatch struct {
	sync.Mutex
	listeners []chan<- IdentifyDispatchMsg
}

func NewIdentifyDispatch() *IdentifyDispatch { return &IdentifyDispatch{} }

func (d *IdentifyDispatch) NotifyIdentifyHeedTrackingSuccess(mctx MetaContext, target keybase1.UID) {
	d.Lock()
	defer d.Unlock()
	for _, listener := range d.listeners {
		select {
		case listener <- IdentifyDispatchMsg{Target: target}:
		default:
		}
	}
}

// Subscribe to notifications.
// `unsubscribe` releases resources associated with the subscription and should be called asap.
func (d *IdentifyDispatch) Subscribe(mctx MetaContext) (unsubscribe func(), recvCh <-chan IdentifyDispatchMsg) {
	ch := make(chan IdentifyDispatchMsg, 10)
	d.Lock()
	defer d.Unlock()
	d.listeners = append(d.listeners, ch)
	unsubscribe = func() {
		d.Lock()
		defer d.Unlock()
		var listeners []chan<- IdentifyDispatchMsg
		for _, ch2 := range d.listeners {
			if ch == ch2 {
				continue
			}
			listeners = append(listeners, ch2)
		}
		d.listeners = listeners
	}
	return unsubscribe, ch
}

// OnLogout drops all subscriptions.
func (d *IdentifyDispatch) OnLogout() {
	d.Lock()
	defer d.Unlock()
	d.listeners = nil
}
