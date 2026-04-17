use std::sync::Arc;
use tokio::sync::broadcast;
use serde::{Serialize, Deserialize};
use std::sync::LazyLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaymentEvent {
    Success { invoice_id: i32 },
    Failed { invoice_id: i32, reason: String },
}

pub struct PaymentHub {
    tx: broadcast::Sender<PaymentEvent>,
}

pub static PAYMENT_HUB: LazyLock<Arc<PaymentHub>> = LazyLock::new(|| Arc::new(PaymentHub::new()));

impl Default for PaymentHub {
    fn default() -> Self {
        Self::new()
    }
}

impl PaymentHub {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }

    pub fn broadcast(&self, event: PaymentEvent) {
        let _ = self.tx.send(event);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<PaymentEvent> {
        self.tx.subscribe()
    }
}
